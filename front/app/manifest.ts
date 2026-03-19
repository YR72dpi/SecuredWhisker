import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "SecWhis",
    name: 'Secured Whisker',
    short_name: 'SecWhis',
    description: 'The secured and open source chat',
    lang: "en",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    orientation: 'portrait',
    theme_color: '#ffffff',
    categories: ['social', 'chat'],
    "display_override" : [
      "standalone",
        "minimal-ui",
        "fullscreen",
        "window-controls-overlay"
    ],
    shortcuts: [
        {
            "name": "Notification manager",
            "url": "/notification",
            "description": "Check and delete devices that can be notified"
        }
    ],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}