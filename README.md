# TailwindCSS ChatGPT Clone

- 這是我的一個面試考題，我就把 Native CSS 換成 TailwindCSS, 教育我自己一下。 :D 
- 讓它上線，還沒加上 reCAPTCHA 希望「還」不會被 cracker bots 打爆。 
- A modern ChatGPT interface clone built with TailwindCSS, offering a clean and responsive chat experience.

## Table of Contents

- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [File Structure](#file-structure)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Demo

https://tailwind-css-chat-gpt-clone.vercel.app/

## Tech Stack

- HTML5
- CSS3
- JavaScript
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [Nuxt 3](https://nuxtjs.org/) - Vue framework for server-side rendering

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14.x or higher)
- [npm](https://www.npmjs.com/) (v6.x or higher) or [Yarn](https://yarnpkg.com/) (v1.22.x or higher)
- Git

## Installation

1. Clone the repository:

```bash
git clone https://github.com/sunpochin/tailwindCSS-chatGPT-clone.git
cd tailwindCSS-chatGPT-clone
```

2. Install dependencies:

```bash
yarn install
```

## Running Locally

1. Start the development server:

```bash
yarn dev
```

2. Open your browser and navigate to `http://localhost:3000`

## File Structure

```
/tailwindCSS-chatGPT-clone
├── assets/                # Uncompiled assets like images, fonts, etc.
├── components/            # Vue components
│   ├── Chat/              # Chat related components
│   ├── Sidebar/           # Sidebar components
│   └── UI/                # Reusable UI components
├── layouts/               # Nuxt layout files
├── middleware/            # Nuxt middleware
├── pages/                 # Vue pages (routes are auto-generated)
├── plugins/               # Vue/Nuxt plugins
├── static/                # Files served as-is (favicon, robots.txt, etc.)
├── store/                 # Vuex store files
├── .gitignore             # Git ignore file
├── nuxt.config.js         # Nuxt configuration
├── package.json           # Project dependencies and scripts
├── tailwind.config.js     # TailwindCSS configuration
└── README.md              # Project documentation
```

## Features

- ChatGPT-like chat interface
- Responsive design using TailwindCSS
- Dark mode support
- Message history
- [Add more features here]

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
