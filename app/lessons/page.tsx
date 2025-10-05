'use client';

import React, { useState } from 'react';

const Lesson = () => {
    const [showAnswer, setShowAnswer] = useState(false);
    const [input, setInput] = useState('');
    const correctAnswer = '5';

    const handleAnswerInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInput(event.target.value);
        if (event.target.value.trim() === correctAnswer) {
            setShowAnswer(true);
        } else {
            setShowAnswer(false);
        }
    };

    return (
        <div className="p-4 font-sans">
            <h1 className="text-3xl font-bold mb-4 text-indigo-700">Learning Long Division</h1>

            <p className="text-lg mb-3">
                Long division is a method for dividing large numbers into smaller, more manageable pieces. Here&apos;s a quick guide to mastering long division.
            </p>

            <h2 className="text-2xl font-semibold mb-2 text-indigo-600">Steps to Perform Long Division</h2>
            <ul className="list-decimal ml-5 mb-4">
                <li>Divide the first number of the dividend by the divisor to get the quotient.</li>
                <li>Multiply the divisor by the quotient and write the result under the dividend.</li>
                <li>Subtract the result from the first step from the dividend to get the remainder.</li>
                <li>Bring down the next number from the dividend if there is one.</li>
                <li>Repeat the process with the new number.</li>
            </ul>

            <div className="bg-blue-100 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-800">Example</h3>
                <p className="mb-2">
                    Let&apos;s divide <strong>955</strong> by <strong>190</strong>.
                </p>
                <p>Steps:</p>
                <ol className="list-decimal ml-5">
                    <li>Divide 955 by 190 which equals approximately 5.</li>
                    <li>Multiply 190 by 5 and get 950.</li>
                    <li>Subtract 950 from 955 to find the remainder which is 5.</li>
                    <li>Since we have processed all digits, we are done.</li>
                </ol>
                <p>The answer is <strong>5 R5</strong>.</p>
            </div>

            <h2 className="text-2xl font-semibold mb-3 text-indigo-600">Quick Quiz</h2>
            <p className="mb-2">What is 950 divided by 190?</p>

            <input
                type="text"
                placeholder="Enter your answer"
                value={input}
                onChange={handleAnswerInput}
                className="border-2 border-gray-300 p-2 mr-2 rounded-sm"
            />

            {showAnswer && (
                <p className="text-green-500 font-semibold">Correct!</p>
            )}

        </div>
    );
};

export default Lesson;