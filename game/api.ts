import * as Http from '@effect/platform/HttpClient'
import { Effect } from 'effect'
import { Click, Login } from './models.ts'

const UA = `Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148`

export const login = (tgWebAppData: string) =>
	Http.request.post('https://api.tapswap.ai/api/account/login').pipe(
		Http.request.setHeader('x-cv', '1'),
		Http.request.setHeader('x-app', 'tapswap_server'),
		Http.request.setHeader('User-Agent', UA),
		Http.request.setHeader('Content-Type', 'application/json'),
		Http.request.jsonBody({
			init_data: tgWebAppData,
			referrer: '',
			bot_key: 'app_bot_0',
		}),
		Effect.andThen(Http.client.fetchOk),
		Effect.andThen(Http.response.schemaBodyJson(Login)),
		Effect.scoped
	)

export const click = (accessToken: string, count: number) =>
	Http.request.post('https://api.tapswap.ai/api/player/submit_taps').pipe(
		Http.request.setHeader('x-cv', '1'),
		Http.request.setHeader('x-app', 'tapswap_server'),
		Http.request.setHeader('User-Agent', UA),
		Http.request.setHeader('Content-Type', 'application/json'),
		Http.request.setHeader('Authorization', `Bearer ${accessToken}`),
		Http.request.jsonBody({
			taps: count,
			time: Date.now(),
		}),
		Effect.andThen(Http.client.fetch),
		Effect.andThen(Http.response.schemaBodyJson(Click)),
		Effect.scoped
	)
