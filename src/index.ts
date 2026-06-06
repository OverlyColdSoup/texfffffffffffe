export default {
  async fetch(request, env, ctx) {
    // Handle POST request (when user clicks "Generate")
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const prompt = formData.get('prompt');

        if (!prompt) {
          return new Response('Missing prompt', { status: 400 });
        }

        // Forward the request to your image generation worker
        const apiResponse = await fetch('https://image-generation.4funusewest.workers.dev', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer 135798642975312468',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: prompt })
        });

        // Return the image (or error) back to the browser
        const contentType = apiResponse.headers.get('content-type');
        if (contentType && contentType.includes('image')) {
          // It's an image — forward it directly
          const imageBlob = await apiResponse.blob();
          return new Response(imageBlob, {
            headers: { 'Content-Type': contentType }
          });
        } else {
          // It's likely a JSON error message — show it
          const errorText = await apiResponse.text();
          return new Response(`API Error: ${errorText}`, { status: 500 });
        }

      } catch (error) {
        return new Response(`Worker Error: ${error.message}`, { status: 500 });
      }
    }

    // Handle GET request — serve the HTML UI
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Image Generator</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; background: #111; color: #eee; }
        textarea { width: 100%; height: 150px; padding: 10px; font-size: 16px; border-radius: 8px; border: 1px solid #444; background: #1a1a1a; color: #eee; resize: vertical; }
        button { background: #cc3333; color: white; border: none; padding: 12px 24px; font-size: 18px; border-radius: 8px; cursor: pointer; margin-top: 10px; width: 100%; }
        button:hover { background: #dd4444; }
        #status { margin-top: 15px; color: #aaa; }
        #image-container { margin-top: 20px; text-align: center; }
        img { max-width: 100%; border-radius: 8px; border: 1px solid #333; }
        .preview { margin-top: 15px; }
        h1 { text-align: center; color: #cc3333; }
        label { font-weight: bold; display: block; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <h1>🎨 Image Generator</h1>
      
      <form id="genForm">
        <label for="prompt">Enter your prompt:</label>
        <textarea id="prompt" name="prompt" placeholder="Knight in a red scarf. Achromatic Grimdark Illustration, Akihiko Yoshida aesthetic...">Knight in a red scarf. Achromatic Grimdark Illustration, Akihiko Yoshida aesthetic. Visual Style: Dark fantasy anime illustration. High-contrast vector-art blending with gritty, painterly overlays.</textarea>
        <button type="submit">🖼️ Generate & Confirm</button>
      </form>

      <div id="status">Waiting for prompt...</div>
      <div id="image-container"></div>

      <script>
        const form = document.getElementById('genForm');
        const status = document.getElementById('status');
        const imageContainer = document.getElementById('image-container');

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const prompt = document.getElementById('prompt').value.trim();
          if (!prompt) {
            status.innerText = '⚠️ Please enter a prompt.';
            return;
          }

          // Show status
          status.innerText = '⏳ Generating... (this may take a moment)';
          imageContainer.innerHTML = '';
          form.querySelector('button').disabled = true;

          const formData = new FormData();
          formData.append('prompt', prompt);

          try {
            const response = await fetch(window.location.href, {
              method: 'POST',
              body: formData
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('image')) {
              // Show the image
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              imageContainer.innerHTML = `<img src="${url}" alt="Generated Image"><p class="preview">✅ Generation complete!</p>`;
              status.innerText = '✅ Success!';
            } else {
              // Show error message
              const text = await response.text();
              status.innerText = '❌ Error: ' + text;
            }
          } catch (error) {
            status.innerText = '❌ Connection Error: ' + error.message;
          } finally {
            form.querySelector('button').disabled = false;
          }
        });
      </script>
    </body>
    </html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}
