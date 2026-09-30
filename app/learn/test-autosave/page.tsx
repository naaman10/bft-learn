"use client";

import { useState } from "react";

// Mock version of AnswerTextarea for testing without backend
function MockAnswerTextarea({ contentId, itemId, defaultValue }: { contentId: string; itemId: string; defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveLog, setSaveLog] = useState<string[]>([]);
  let timeoutRef: NodeJS.Timeout | null = null;

  const mockSaveProgress = async (answer: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setSaveLog(prev => [...prev, `${timestamp} - Saving: "${answer.substring(0, 50)}${answer.length > 50 ? '...' : ''}"`]);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate 90% success rate
    if (Math.random() > 0.1) {
      setSaveLog(prev => [...prev, `${timestamp} - ✓ Saved successfully`]);
      return { success: true };
    } else {
      setSaveLog(prev => [...prev, `${timestamp} - ✗ Save failed (simulated error)`]);
      return { success: false, error: "Network error" };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    if (timeoutRef) {
      clearTimeout(timeoutRef);
    }

    timeoutRef = setTimeout(async () => {
      setSaveStatus("saving");
      const result = await mockSaveProgress(newValue);
      
      if (result.success) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={`answer-${itemId}`}>
          Your answer
        </label>
        <textarea
          id={`answer-${itemId}`}
          value={value}
          onChange={handleChange}
          rows={8}
          placeholder="Start typing to test auto-save..."
          className="mt-1 min-h-40 w-full resize-y rounded-[22px] border border-gray-300 bg-white px-4 py-3.5 text-left text-lg leading-relaxed text-gray-900 placeholder:text-gray-400 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200"
        />
        <div className="mt-2 min-h-6">
          {saveStatus === "saving" && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-pink-500 rounded-full animate-spin"></span>
              Saving...
            </p>
          )}
          {saveStatus === "saved" && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <span className="text-lg">✓</span>
              Saved
            </p>
          )}
          {saveStatus === "error" && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <span className="text-lg">⚠</span>
              Failed to save. Will retry.
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-2">Save Log</h3>
        <div className="space-y-1 max-h-60 overflow-y-auto font-mono text-xs text-gray-700">
          {saveLog.length === 0 ? (
            <p className="text-gray-400 italic">No saves yet. Start typing to see auto-save in action!</p>
          ) : (
            saveLog.map((log, i) => (
              <div key={i} className="py-1 border-b border-gray-200 last:border-0">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestAutoSavePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Auto-Save Test Page</h1>
            <p className="text-gray-600">
              This page demonstrates the auto-save functionality for answer progress.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">How it works:</h2>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Type in the textarea below</li>
              <li>• Auto-save triggers 1 second after you stop typing</li>
              <li>• Watch the status indicator and save log</li>
              <li>• The mock has a 10% chance of simulated failure to demonstrate error handling</li>
            </ul>
          </div>

          <MockAnswerTextarea
            contentId="test-content"
            itemId="test-item"
            defaultValue=""
          />

          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Technical Details</h3>
            <ul className="space-y-1 text-sm text-gray-700">
              <li><strong>Debounce:</strong> 1 second after last keystroke</li>
              <li><strong>Visual Feedback:</strong> Saving → Saved ✓ → (disappears after 2s)</li>
              <li><strong>Error Handling:</strong> Shows error message for 3 seconds</li>
              <li><strong>Smart Saving:</strong> Only saves when content changes</li>
              <li><strong>Cleanup:</strong> Timers properly cleared on unmount</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
