import { Server, Socket } from 'socket.io';
import { langchainService } from '../services/langchainService';
import type { AnalysisRequest, QuestionRequest, RatingRequest } from '../types';

interface ActiveGeneration {
  id: string;
  active: boolean;
}

export function initializeSocketIO(io: Server) {
  const activeGenerations = new Map<string, Map<string, ActiveGeneration>>();
  
  // Cleanup stale entries every hour
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [socketId, gens] of activeGenerations.entries()) {
      for (const [genId, gen] of gens.entries()) {
        // Remove inactive generations older than 1 hour
        if (!gen.active && (now - parseInt(genId.split('-')[1] || '0')) > 3600000) {
          gens.delete(genId);
        }
      }
      // Remove empty socket entries
      if (gens.size === 0) {
        activeGenerations.delete(socketId);
      }
    }
  }, 3600000); // Run every hour

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);
    activeGenerations.set(socket.id, new Map());

    // Combined analysis - single LLM call for all three outputs
    socket.on('analyze:batch', async (data: {
      txId: string;
      question: string;
      answer: string;
      turns: any[];
      interviewContext: any;
      coveredTopics: string[];
      language: string;
      competency: string;
    }) => {
      const { txId, question, answer, turns, interviewContext, language } = data;
      const socketGens = activeGenerations.get(socket.id)!;
      
      // Cancel any previous generations for this socket
      for (const [id, gen] of socketGens.entries()) {
        if (gen.active) {
          gen.active = false;
          langchainService.cancelGeneration(id);
        }
      }
      socketGens.clear();

      socketGens.set(txId, { id: txId, active: true });
      const modelName = 'gpt-4o-mini';

      try {
        const stream = langchainService.streamCombinedAnalysis(
          question,
          answer,
          turns,
          interviewContext,
          language,
          txId,
          modelName
        );

        for await (const { type, content } of stream) {
          const gen = socketGens.get(txId);
          if (!gen || !gen.active) {
            console.log(`Combined analysis cancelled: ${txId}`);
            break;
          }

          socket.emit('analysis:chunk', { type, chunk: content, txId });
        }

        const gen = socketGens.get(txId);
        if (gen && gen.active) {
          socket.emit('analysis:complete', { type: 'analysis', txId });
          socket.emit('analysis:complete', { type: 'questions', txId });
          socket.emit('analysis:complete', { type: 'rating', txId });
        }
      } catch (error: any) {
        console.error('Error in combined analysis:', error);
        socket.emit('analysis:error', { type: 'analysis', error: error.message, txId });
      } finally {
        socketGens.delete(txId);
      }
    });

    // Legacy individual handlers for backward compatibility
    socket.on('analyze:response', async (data: AnalysisRequest) => {
      const { turns, currentQuestion, candidateAnswer, interviewContext, language, generationId } = data;

      if (!candidateAnswer?.trim()) {
        socket.emit('analyze:error', { error: 'Candidate answer is required', generationId });
        return;
      }

      const socketGens = activeGenerations.get(socket.id)!;
      
      // Cancel previous analysis
      for (const [id, gen] of socketGens.entries()) {
        if (id.includes('-a') && gen.active) {
          gen.active = false;
          langchainService.cancelGeneration(id);
        }
      }

      socketGens.set(generationId, { id: generationId, active: true });

      try {
        const stream = langchainService.streamAnalysis(
          turns, currentQuestion, candidateAnswer, interviewContext, language
        );

        for await (const chunk of stream) {
          const gen = socketGens.get(generationId);
          if (!gen || !gen.active) break;
          socket.emit('analyze:chunk', { chunk, generationId });
        }

        const gen = socketGens.get(generationId);
        if (gen && gen.active) {
          socket.emit('analyze:complete', { generationId });
        }
      } catch (error: any) {
        socket.emit('analyze:error', { error: error.message, generationId });
      } finally {
        socketGens.delete(generationId);
      }
    });

    socket.on('suggest:questions', async (data: QuestionRequest) => {
      const { turns, interviewContext, coveredTopics, language, generationId } = data;
      const socketGens = activeGenerations.get(socket.id)!;

      // Cancel previous questions generation
      for (const [id, gen] of socketGens.entries()) {
        if (id.includes('-q') && gen.active) {
          gen.active = false;
          langchainService.cancelGeneration(id);
        }
      }

      socketGens.set(generationId, { id: generationId, active: true });

      try {
        const stream = langchainService.streamQuestionSuggestions(
          turns, interviewContext, coveredTopics, language
        );

        for await (const chunk of stream) {
          const gen = socketGens.get(generationId);
          if (!gen || !gen.active) break;
          socket.emit('questions:chunk', { chunk, generationId });
        }

        const gen = socketGens.get(generationId);
        if (gen && gen.active) {
          socket.emit('questions:complete', { generationId });
        }
      } catch (error: any) {
        socket.emit('questions:error', { error: error.message, generationId });
      } finally {
        socketGens.delete(generationId);
      }
    });

    socket.on('suggest:rating', async (data: RatingRequest) => {
      const { question, answer, competency, interviewContext, generationId } = data;
      const socketGens = activeGenerations.get(socket.id)!;

      // Cancel previous rating generation
      for (const [id, gen] of socketGens.entries()) {
        if (id.includes('-r') && gen.active) {
          gen.active = false;
          langchainService.cancelGeneration(id);
        }
      }

      socketGens.set(generationId, { id: generationId, active: true });

      try {
        const stream = langchainService.streamRatingSuggestion(
          question, answer, competency, interviewContext
        );

        for await (const chunk of stream) {
          const gen = socketGens.get(generationId);
          if (!gen || !gen.active) break;
          socket.emit('rating:chunk', { chunk, generationId });
        }

        const gen = socketGens.get(generationId);
        if (gen && gen.active) {
          socket.emit('rating:complete', { generationId });
        }
      } catch (error: any) {
        socket.emit('rating:error', { error: error.message, generationId });
      } finally {
        socketGens.delete(generationId);
      }
    });

    socket.on('analyze:cancel', (data: { generationId?: string; txId?: string }) => {
      const socketGens = activeGenerations.get(socket.id);
      if (!socketGens) return;

      const idToCancel = data.generationId || data.txId;
      if (idToCancel) {
        const gen = socketGens.get(idToCancel);
        if (gen) {
          gen.active = false;
          langchainService.cancelGeneration(idToCancel);
          console.log(`Cancelled generation: ${idToCancel}`);
        }
      } else {
        // Cancel all
        for (const [id, gen] of socketGens.entries()) {
          gen.active = false;
          langchainService.cancelGeneration(id);
        }
        socketGens.clear();
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const socketGens = activeGenerations.get(socket.id);
      if (socketGens) {
        for (const [id] of socketGens.entries()) {
          langchainService.cancelGeneration(id);
        }
      }
      activeGenerations.delete(socket.id);
      
      // Remove all socket listeners to prevent memory leaks
      socket.removeAllListeners();
    });
  });

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
  });

  return io;
}
