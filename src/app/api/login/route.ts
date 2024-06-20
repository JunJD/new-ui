import { NextResponse } from "next/server"
import Cors from 'cors';
// Initialize the cors middleware
const cors = Cors({
    origin: "*",
    methods: ['GET', 'HEAD'],
});

function runMiddleware(req: Request, res: NextResponse, fn: any) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result: any) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}
export const POST = async function (req: Request, res: NextResponse) {
    await runMiddleware(req, res, cors);
    const { usercode, password } = await req.json()
    const response = await fetch(`
    https://jgjfjdcgl.gat.zj.gov.cn:5102/inf_zpm/hz_mysql_api/BatteryBinding/login?usercode=${usercode}&password=${password}&city=0573
    `, {
        method: "GET",
        headers: {
            authority: 'jgjfjdcgl.gat.zj.gov.cn:5102',
            scheme: 'https',
            'accept-encoding': 'gzip',
            'user-agent': "okhttp/4.9.3"
        }
    })
    const data = await response.json()

    return NextResponse.json({ ...data }, { status: 200 })
}
