const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Stream chat completion from backend using fetch ReadableStream for SSE events
 * @param {Object} options
 * @param {string} options.query - Student's question
 * @param {string} options.departmentFilter - Department metadata filter
 * @param {string} options.conversationId - Active conversation ID
 * @param {function} options.onToken - Callback for streamed text chunks
 * @param {function} options.onDone - Callback when streaming completes with sources
 * @param {function} options.onError - Callback on stream error
 */
export const streamChatMessage = async ({
  query,
  departmentFilter = 'All',
  conversationId = null,
  onToken,
  onDone,
  onError,
}) => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('campuswise_token') : null;

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        query,
        departmentFilter,
        conversationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.replace(/^data: /, '').trim();
          if (!jsonStr) continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.type === 'token') {
              if (onToken) onToken(data.token);
            } else if (data.type === 'done') {
              if (onDone) onDone(data);
            } else if (data.type === 'error') {
              if (onError) onError(new Error(data.error));
            }
          } catch (parseErr) {
            console.warn('[SSE] JSON parse warning:', parseErr.message, jsonStr);
          }
        }
      }
    }
  } catch (error) {
    if (onError) onError(error);
  }
};
