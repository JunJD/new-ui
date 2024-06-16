'use client'

// import { fetchD, delay } from '@/utils/fetch';
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef, useState } from 'react';
interface updateListPayload {
  value: string,
}
export default function Home() {
  const [list, setList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const buffer = useRef<string[]>([]);
  const _effectRef = useRef<any>(null);
  useEffect(() => {
    async function _effect() {
      _effectRef.current = await listen<updateListPayload>('updateList', (event) => {
        console.log(`Got error in window ${event.windowLabel}, payload: ${event.payload.value}`);
        buffer.current = [event.payload.value, ...buffer.current]
        updateList()
        if (event.payload.value === 'end') {
          setLoading(false)
        }
      });
    }
    _effect()
    return () => {
      _effectRef.current && _effectRef.current();
    }
  })

  async function updateList() {
    setList((prev) => {
      if (buffer.current.length > prev.length + Math.floor(prev.length * 0.1) + 1) {
        return [...buffer.current, ...prev]
      }
      return prev
    })
  }

  async function findValidElectroCarByIds(array: string[]) {
    try {
      return await invoke('find_valid_electro_car_by_ids', {
        array,
      });
    } catch (error) {
      console.error('Error find_valid_electro_car_by_ids:', error);
    }
  }
  async function handleClick() {
    if (loading) return
    setLoading(true)
    const paths = await findValidElectroCarByIds(Array.from({ length: 30000 }).map((_, i) => 'new_auto_log_' + new Date().toISOString() + '_' + i))
    console.log(paths, 'paths')
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="h-[100%] flex flex-col z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex cursor-pointer">
        <button className='text-2xl text-red-500' onClick={handleClick}>{
          loading ? 'loading...' : 'click me 30000'
        }</button>
        <div className='overflow-auto flex-1 w-[500px] flex flex-col'>
          {
            list.slice(0,3).map((item, index) => {
              return <span key={item+index}>{item}</span>
            })
          }
        </div>
      </div>
    </main>
  );
}
