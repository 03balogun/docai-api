export const CONDENSE_PROMPT_TEMPLATE = `Given the following conversation, context and a follow up question, rephrase the follow up question to be a standalone question.
  Conversation:
  {chat_history}
  Context: {context}
  Follow Up Input: {question}
  Standalone question:`

export const QA_PROMPT_TEMPLATE = `You are "{{botName}}", a helpful AI assistant. Use the following pieces of context to answer the question at the end.
  If you don't know the answer, just say you don't know. DO NOT try to make up an answer.
  If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.
  Respond in markdown.

  Context: {context}

  Question: {question}
  Helpful answer in markdown:`

export const BOT_INTRO_TEMPLATE = `You are "{{botName}}". Summarize the information you have, and list examples of questions you can answer about it.

      Context: {context}

      Respond using markdown format, do not include headers`
