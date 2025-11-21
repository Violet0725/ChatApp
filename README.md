# 💬 Real-Time Chat Application (Discord Clone)

<img width="1900" height="921" alt="image" src="https://github.com/user-attachments/assets/1c3b7ed3-bcc3-431a-8960-8c58192dad1d" />

## 🚀 Live Demo
**[Click here to view the live application](https://eric-chat-app.vercel.app)**

## 📖 About The Project
This is a full-stack real-time messaging platform engineered to mimic modern collaboration tools like Discord. Unlike standard HTTP-based apps, this project utilizes **WebSockets** to establish a persistent, bi-directional connection, ensuring zero-latency communication.

It features dynamic room creation, live user presence tracking ("Who's Online"), and persistent message history stored in a cloud database.

### Key Features
* ⚡ **Real-Time Messaging:** Instant communication using Socket.io (no page refreshes required).
* 👥 **Multi-Room Support:** Users can create and join dynamic channels (e.g., #general, #react-dev).
* 🟢 **Live User Presence:** Real-time sidebar showing currently online users in the active room.
* ⌨️ **Typing Indicators:** Visual cues when other users are typing.
* 💾 **Persistent History:** All messages and channels are stored in MongoDB Atlas.
* 🎨 **Responsive UI:** A clean, dark-mode interface built with Tailwind CSS.

## 🛠️ Tech Stack

**Frontend:**
* React.js (Vite)
* Tailwind CSS
* Socket.io-client

**Backend:**
* Node.js & Express.js
* Socket.io
* MongoDB (Atlas) & Mongoose

**Deployment:**
* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

## ⚙️ Getting Started (Run it Locally)

Follow these steps to run the project on your local machine.

### Prerequisites
* Node.js installed
* MongoDB connection string (or local instance)

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/Violet0725/ChatApp.git](https://github.com/Violet0725/ChatApp.git)
    cd ChatApp
    ```

2.  **Install Backend Dependencies**
    ```bash
    cd server
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the `server` folder and add your MongoDB URL:
    ```env
    MONGO_URL=your_mongodb_connection_string_here
    PORT=3001
    ```

4.  **Install Frontend Dependencies**
    ```bash
    cd ../client
    npm install
    ```

5.  **Run the App**
    * **Terminal 1 (Server):**
        ```bash
        cd server
        npm run dev
        ```
    * **Terminal 2 (Client):**
        ```bash
        cd client
        npm run dev
        ```

## 🔒 Security Features
* **Environment Variables:** Sensitive database credentials are secured using `dotenv` and never exposed in the codebase.
* **CORS Configuration:** Strict Cross-Origin Resource Sharing policies are implemented to allow traffic only from trusted domains (Vercel & Localhost).

## 👤 Author

**Eric Zhou**
* Computing Student @ Queen's University
* [LinkedIn](https://www.linkedin.com/in/ericzhou040725/) 
* [Portfolio](https://violet0725.github.io/my-portfolio/)
