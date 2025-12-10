<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UNIQID Intranet</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script>
      tailwind.config = {
        theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
            },
            colors: {
              brand: {
                50: '#f4f7fa',
                100: '#e3ebf5',
                500: '#3b82f6',
                600: '#2563eb',
                800: '#1e40af',
                900: '#1e3a8a',
              }
            }
          }
        }
      }
    </script>
  <script type="importmap">
{
  "imports": {
    "react": "https://aistudiocdn.com/react@^19.2.1",
    "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.1/",
    "react/": "https://aistudiocdn.com/react@^19.2.1/",
    "react-router-dom": "https://aistudiocdn.com/react-router-dom@^7.10.1",
    "lucide-react": "https://aistudiocdn.com/lucide-react@^0.556.0"
  }
}
</script>
</head>
  <body class="bg-gray-50 text-slate-800">
    <div id="root"></div>
  </body>
</html>
