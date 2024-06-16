'use client'

// import { fetchD, delay } from '@/utils/fetch';
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event';
import { useEffect, useRef, useState } from 'react';
import { delay } from '@/utils/fetch';
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
        if (event.payload.value === 'end') {
          console.log('end!')
          return
        }
        console.log(`Got error in window ${event.windowLabel}, payload: ${event.payload.value}`);
        buffer.current = [event.payload.value, ...buffer.current]
        updateList()
      });
    }
    _effect()
    return () => {
      _effectRef.current && _effectRef.current();
    }
  })

  async function updateList() {
    setList((prev) => {
      const bufferValue = buffer.current
      if (bufferValue.length > prev.length + Math.floor(prev.length * 0.1) + 1) {
        return Array.from(new Set([...prev, ...bufferValue]))
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
    
    function getTask(taskList: string[]) {
      return taskList.reduce<string[][]>((prev, curr) => {
        console.log(curr, '<=>==curr ')
        if (prev.length === 0) {
          return [[curr]]
        }
        if (prev[prev.length - 1].length < 10) {
          prev[prev.length - 1].push(curr);
          return prev;
        }
        prev.push([curr]);
        return prev;
      }, []);
    }
    const taskList =  Array.from({ length: 30 }).map((_, i) => `[${i}]`+'new_auto_log_' + new Date())
    const tasks = getTask(taskList)

    console.log( '-------')
    setLoading(true)
    for (const task of tasks) {
      console.log(task, 'task')
      const paths = await findValidElectroCarByIds(task)
      delay(10000)
      console.log(paths, 'paths')
    }
    setLoading(false)
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="h-[100%] flex flex-col z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex cursor-pointer">
        <button className='text-2xl text-red-500' onClick={handleClick}>{
          loading ? `loading...${list.length}` : 'click me 30000'
        }</button>
        <div className='overflow-auto flex-1 w-[500px] flex flex-col items-center justify-between p-2'>
          {
            list.slice(-100).map((item, index) => {
              return <span key={item+"_"+index}>{item}</span>
            })
          }
        </div>
      </div>
    </main>
  );
}
