import { BunRuntime } from '@effect/platform-bun'
import chalk from 'chalk'
import { Config, ConfigProvider, Effect, pipe, Schedule } from 'effect'
import { constVoid } from 'effect/Function'
import { click, login } from './game/api.ts'
import { fmt } from './game/fmt.ts'
import { Telegram } from './telegram/client.ts'

type State = {
	token: string
	energy: number
	balance: number
}

const miner = Effect.gen(function* (_) {
	const client = yield* _(Telegram)
	const peerId = yield* _(client.getPeerId('tapswap_bot'))

	const webViewResultUrl = yield* _(
		client.requestWebView({
			url: 'https://app.tapswap.club',
			bot: peerId,
			peer: peerId,
		})
	)

	const tgWebAppData = webViewResultUrl.searchParams.get('tgWebAppData')!
	if (!tgWebAppData) {
		return Effect.none
	}

	const state: State = {
		token: '',
		energy: 0,
		balance: 0,
	}

	const sync = Effect.gen(function* (_) {
		const result = yield* login(tgWebAppData)

		state.token = result.access_token
		state.energy = result.player.energy
		state.balance = result.player.shares
	})

	const mine = Effect.gen(function* (_) {
		const count = yield* Config.number('GAME_CLICK_COUNT').pipe(Config.withDefault(2))

		const { player } = yield* click(state.token, count)
		const energyDiff = player.energy - state.energy
		const balanceDiff = player.shares - state.balance
		state.energy = player.energy
		state.balance = player.shares

		console.log(
			chalk.bold(new Date().toLocaleTimeString()),
			'|⚡️'.padEnd(4),
			chalk.bold(`${state.energy}`.padEnd(4)),
			chalk.bold[energyDiff > 0 ? 'green' : 'red'](fmt(energyDiff).padEnd(4)),
			'|🪙'.padEnd(4),
			chalk.bold(`${state.balance}`.padEnd(8)),
			chalk.bold[balanceDiff > 0 ? 'green' : 'red'](fmt(balanceDiff).padEnd(4))
		)
	})

	const mineInterval = yield* Config.duration('GAME_MINE_INTERVAL').pipe(Config.withDefault('10 seconds'))
	const syncInterval = yield* Config.duration('GAME_SYNC_INTERVAL').pipe(Config.withDefault('360 seconds'))

	const miner = Effect.repeat(
		mine,
		Schedule.addDelay(Schedule.forever, () => mineInterval)
	)

	const syncer = Effect.repeat(
		sync,
		Schedule.addDelay(Schedule.forever, () => syncInterval)
	)

	yield* sync
	yield* Effect.all([miner, syncer], { concurrency: 'unbounded' })
})

const policy = Schedule.addDelay(Schedule.forever, () => '15 seconds')

const program = Effect.match(miner, {
	onSuccess: constVoid,
	onFailure: (err) => {
		console.error(chalk.bold(new Date().toLocaleTimeString()), '‼️FAILED:', err._tag)
	},
})

pipe(
	Effect.all([Effect.repeat(program, policy), Effect.sync(() => process.stdout.write('\u001Bc\u001B[3J'))], {
		concurrency: 'unbounded',
	}),
	Effect.provide(Telegram.live),
	Effect.withConfigProvider(ConfigProvider.fromEnv()),
	BunRuntime.runMain
)
