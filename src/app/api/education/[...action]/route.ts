import { learnerApi } from '@/lib/education/session';

type Context = {params: Promise<{action:string[]}>};
export async function GET(request: Request, {params}: Context) {
    return learnerApi(request, (await params).action.join('/'));
}
export { GET as HEAD, GET as POST };
