let index = 0
export const fetchD = async () => {
    return new Promise<string>((resove) => {
        setTimeout(() => {
            resove('hello'+index++)
        }, 100)
    })
}

export const delay = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}
