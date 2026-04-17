import { Server, Socket } from 'socket.io';
import { langchainService } from '../services/langchainService';
import type { AnalysisRequest, QuestionRequest, RatingRequest, NextQuestionRequest } from '../types';

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
      console.log(`[Socket:${socket.id}] analyze:batch received | txId=${txId}`);
      console.log(`[Socket:${socket.id}]   Q: "${question?.substring(0, 80)}"`);
      console.log(`[Socket:${socket.id}]   A: "${answer?.substring(0, 80)}"`);
      console.log(`[Socket:${socket.id}]   turns: ${turns?.length || 0}, role: ${interviewContext?.role}, skills: [${interviewContext?.requiredSkills?.join(', ')}], lang: ${language}`);
      const socketGens = activeGenerations.get(socket.id)!;
      
      // Cancel any previous generations for this socket
      for (const [id, gen] of socketGens.entries()) {
        if (gen.active) {
          gen.active = false;
          langchainService.cancelGeneration(id);
          console.log(`[Socket:${socket.id}] Cancelled previous generation: ${id}`);
        }
      }
      socketGens.clear();

      socketGens.set(txId, { id: txId, active: true });
      const modelName = 'gpt-4o-mini';

      try {
        console.log(`[Socket:${socket.id}] Starting streamCombinedAnalysis | model=${modelName}`);
        const stream = langchainService.streamCombinedAnalysis(
          question,
          answer,
          turns,
          interviewContext,
          language,
          txId,
          modelName
        );

        let chunkCount = 0;
        const sectionChunks: Record<string, number> = { analysis: 0, questions: 0, rating: 0 };
        for await (const { type, content } of stream) {
          const gen = socketGens.get(txId);
          if (!gen || !gen.active) {
            console.log(`[Socket:${socket.id}] Combined analysis cancelled: ${txId} after ${chunkCount} chunks`);
            break;
          }
          chunkCount++;
          sectionChunks[type] = (sectionChunks[type] || 0) + 1;
          socket.emit('analysis:chunk', { type, chunk: content, txId });
        }

        console.log(`[Socket:${socket.id}] Stream finished | total=${chunkCount} analysis=${sectionChunks.analysis} questions=${sectionChunks.questions} rating=${sectionChunks.rating}`);

        const gen = socketGens.get(txId);
        if (gen && gen.active) {
          socket.emit('analysis:complete', { type: 'analysis', txId });
          socket.emit('analysis:complete', { type: 'questions', txId });
          socket.emit('analysis:complete', { type: 'rating', txId });
          console.log(`[Socket:${socket.id}] All analysis:complete events emitted for ${txId}`);
        } else {
          console.log(`[Socket:${socket.id}] Generation inactive, skipping complete events for ${txId}`);
        }
      } catch (error: any) {
        console.error(`[Socket:${socket.id}] Error in combined analysis:`, error.message, error.stack?.substring(0, 300));
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

    // Structured next-question generation (Co-Pilot)
    socket.on('suggest:next-question', async (data: NextQuestionRequest) => {
      const {
        txId, interviewContext, turns, topicProgress, pendingTopics,
        questionsAsked, lastAnswerSummary, lastAnswerScore,
        currentStage, totalQuestionsAsked, language
      } = data;
      console.log(`[Socket:${socket.id}] suggest:next-question received | txId=${txId}`);
      console.log(`[Socket:${socket.id}]   stage=${currentStage} totalQ=${totalQuestionsAsked} pending=[${pendingTopics?.join(',')}] lastScore=${lastAnswerScore}`);
      console.log(`[Socket:${socket.id}]   topicProgress: ${JSON.stringify(topicProgress?.map(tp => `${tp.topic}:${tp.questionsAsked}`))}`);
      console.log(`[Socket:${socket.id}]   questionsAsked: ${questionsAsked?.length || 0} items`);
      const socketGens = activeGenerations.get(socket.id)!;

      // Cancel previous next-question generation
      for (const [id, gen] of socketGens.entries()) {
        if (id.startsWith('nq-') && gen.active) {
          gen.active = false;
          langchainService.cancelGeneration(id);
          console.log(`[Socket:${socket.id}] Cancelled previous nq generation: ${id}`);
        }
      }

      const generationId = `nq-${txId}`;
      socketGens.set(generationId, { id: generationId, active: true });

      try {
        console.log(`[Socket:${socket.id}] Starting streamStructuredNextQuestion | genId=${generationId}`);
        const stream = langchainService.streamStructuredNextQuestion(
          interviewContext,
          turns,
          topicProgress,
          pendingTopics,
          questionsAsked,
          lastAnswerSummary,
          lastAnswerScore,
          currentStage,
          totalQuestionsAsked,
          language,
          generationId
        );

        let nqChunkCount = 0;
        for await (const chunk of stream) {
          const gen = socketGens.get(generationId);
          if (!gen || !gen.active) {
            console.log(`[Socket:${socket.id}] Next-question generation cancelled: ${generationId} after ${nqChunkCount} chunks`);
            break;
          }
          nqChunkCount++;
          if (nqChunkCount === 1) {
            console.log(`[Socket:${socket.id}] First nq chunk: "${chunk.substring(0, 60)}"`);
          }
          socket.emit('next-question:chunk', { chunk, txId });
        }

        console.log(`[Socket:${socket.id}] NQ stream finished | totalChunks=${nqChunkCount}`);

        const gen = socketGens.get(generationId);
        if (gen && gen.active) {
          socket.emit('next-question:complete', { txId });
          console.log(`[Socket:${socket.id}] next-question:complete emitted for ${txId}`);
        } else {
          console.log(`[Socket:${socket.id}] NQ generation inactive, skipping complete for ${txId}`);
        }
      } catch (error: any) {
        console.error(`[Socket:${socket.id}] Error in next-question generation:`, error.message, error.stack?.substring(0, 300));
        socket.emit('next-question:error', { error: error.message, txId });
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
