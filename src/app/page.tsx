'use client'

import { invoke } from '@tauri-apps/api/tauri'
export default function Home() {
  async function writeToFile() {
    try {
      const paths = await invoke('write_multiple_times', {
        filename: 'example.txt',
        content: 'This is a test',
        times: 10
      });
      console.log('All writes completed. Paths:', paths);
    } catch (error) {
      console.error('Error writing to file:', error);
    }
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex" onClick={writeToFile}>
        你好
      </div>
    </main>
  );
}
