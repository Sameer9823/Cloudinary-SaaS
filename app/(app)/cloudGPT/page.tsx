'use client';
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

// Define the type for messages
type Message = {
  type: "user" | "bot";
  text: string;
};

export default function Home() {
  const [question, setQuestion] = useState<string>(""); // Question is a string
  const [messages, setMessages] = useState<Message[]>([]); // Messages is an array of Message objects
  const [generatingAnswer, setGeneratingAnswer] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);


  const loadingQuotes = [
    "Good things take time!",
    "Patience is the key to brilliance...",
    "Crafting the perfect response...",
    "AI is thinking... Stay tuned!",
    "Let me find the best answer for you!"
  ];

  const randomQuote = loadingQuotes[Math.floor(Math.random() * loadingQuotes.length)];

  // Load history from localStorage on mount
  useEffect(() => {
    const savedMessages = JSON.parse(localStorage.getItem("chatHistory") || "[]") as Message[];
    if (savedMessages) setMessages(savedMessages);
  }, []);

  // Save history to localStorage when messages change
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function cleanBotResponse(text: string) {
    return text.replace(/\*/g, ""); // Remove unwanted stars or markdown symbols
  }

  async function generateAnswer(e: React.FormEvent<HTMLFormElement>) {
    setGeneratingAnswer(true);
    e.preventDefault();

    const userMessage: Message = { type: "user", text: question };

    // Add both user message and loading quote at the same time
    setMessages((prev) => [...prev, userMessage, { type: "bot", text: randomQuote }]);
    setQuestion(""); // Clear the question input

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyA5isHdIscq9RUDiPVgdqQuaeMDxV8RZgY`,
        {
          contents: [{ parts: [{ text: question }] }],
        }
      );

      const botMessage: Message = {
        type: "bot",
        text: cleanBotResponse(response.data.candidates[0].content.parts[0].text),
      };

      // Replace the loading message with the actual bot response
      setMessages((prev) => {
        const updatedMessages = [...prev];
        updatedMessages.pop(); // Remove the loading quote
        return [...updatedMessages, botMessage];
      });
    } catch (error) {
      console.log(error);
      const errorMessage: Message = {
        type: "bot",
        text: "Sorry - Something went wrong. Please try again!",
      };
      setMessages((prev) => {
        const updatedMessages = [...prev];
        updatedMessages.pop(); // Remove the loading quote
        return [...updatedMessages, errorMessage];
      });
    }

    setGeneratingAnswer(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">
          Cloudinary <span className="bg-gradient-to-r from-orange-500 via-indigo-500 to-green-500 text-transparent bg-clip-text">GPT</span>
        </h1>
        <p className="text-lg text-gray-300 mt-2">
          Engage in Real-Time, Intelligent Conversations
        </p>
      </div>

      {/* Chat AI Container */}
      <div className="w-full max-w-5xl rounded-lg shadow-2xl bg-gray-800 text-white flex flex-col h-[700px]">
        <div className="bg-gray-700 text-white text-center p-4 rounded-t-lg border-b">
          <h1 className="text-2xl font-bold">GPT</h1>
          <p className="text-sm bg-gradient-to-r from-orange-500 via-indigo-500 to-green-500 text-transparent bg-clip-text">Powered by AI Integrated SAAS</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[600px]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg lg:max-w-[90%] max-w-[100%] ${
                message.type === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-700 text-white self-start"
              }`}
            >
              {message.type === "bot" ? (
                <pre className="whitespace-pre-wrap leading-relaxed text-[#D1B3FF] font-bold">
                  {message.text}
                </pre>
              ) : (
                <span>{message.text}</span>
              )}
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={generateAnswer} className="flex border-t border-gray-600">
          <input
            required
            className="border-none rounded-lg w-full p-4 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask your question..."
          />
          <button
            type="submit"
            className={`bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-all duration-300 ml-2 ${
              generatingAnswer ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={generatingAnswer}
          >
            {generatingAnswer ? "..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
