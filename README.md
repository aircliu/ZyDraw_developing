# Zydraw 🎨

Welcome to **Zydraw**, an innovative tool that bridges the gap between design and code. Zydraw allows you to create interactive HTML content within a canvas-like environment, making it perfect for prototyping, teaching, and exploring web design concepts.

## Tutorial

Check out our tutorial video to get started with ZyDraw:

[![ZyDraw Tutorial](https://img.youtube.com/vi/z_VnUCVN6tI/0.jpg)](https://youtu.be/z_VnUCVN6tI 'ZyDraw Tutorial')

Click the image above to watch the video on YouTube. You can also access this tutorial video by clicking the "Tutorial" button in the bottom right corner of the application.

## 🚀 Features

- **Interactive HTML Preview**: Design and interact with HTML content directly on the canvas.
- **Code Export**: Easily export your designs as HTML for further development.
- **CodeSandbox and StackBlitz Integration**: Open your designs directly in popular online code editors for quick iteration and sharing.
- **Responsive Design**: Create designs that adapt to different screen sizes.
- **Screenshot Functionality**: Capture your designs for easy sharing and documentation.

## 🛠️ Getting Started

To get Zydraw up and running locally, follow these steps:

### Prerequisites

- **Node.js** (version specified in `.nvmrc`)
- **npm** or **yarn**

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/zydraw.git
   cd zydraw
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open `http://localhost:3000` in your browser to see Zydraw in action!

## 🖌️ Using Zydraw

1. **Creating Content**: Use the canvas to create your design. You can add shapes, text, and other HTML elements.
2. **Previewing**: Double-click on a shape to interact with the HTML content inside it.
3. **Exporting**:
   - Click the "•••" button on a shape to open the options menu.
   - Choose "Copy HTML" to get the raw HTML of your design.
   - Select "Open in CodeSandbox" or "Open in StackBlitz" to continue editing in an online IDE.
4. **Taking Screenshots**: Zydraw automatically captures screenshots of your designs for easy sharing and exporting.

## 🧩 Key Components

- **PreviewShapeUtil**: The core component that renders HTML content within shapes on the canvas.
- **Dropdown**: Provides options for copying and exporting your designs.

## 🙏 Acknowledgements

- Built with [tldraw](https://www.tldraw.com/)
- Integrates with [CodeSandbox](https://codesandbox.io/) and [StackBlitz](https://stackblitz.com/)

---

Happy designing with Zydraw! If you have any questions or run into issues, please open an issue on our GitHub repository.
