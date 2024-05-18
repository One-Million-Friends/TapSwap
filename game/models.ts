import { Schema } from '@effect/schema'
import { type Annotable, DateFromSelf, transform } from '@effect/schema/Schema'

export interface DateFromTime extends Annotable<DateFromTime, Date, number> {}

export const DateFromTime: DateFromTime = transform(Schema.Number, DateFromSelf, {
	decode: (s) => new Date(s),
	encode: (n) => n.getTime(),
}).annotations({ identifier: 'DateFromTime' })

export const Boost = Schema.Struct({
	type: Schema.Union(Schema.Enums({ energy: 'energy', turbo: 'turbo' })),
	cnt: Schema.Number,
	end: Schema.Number,
})

export const Player = Schema.Struct({
	id: Schema.Number,
	name: Schema.String,
	full_name: Schema.String,
	login_ts: DateFromTime,
	time: DateFromTime,
	energy: Schema.Number,
	shares: Schema.Number,
	tokens: Schema.Number,
	ligue: Schema.Number,
	energy_level: Schema.Number,
	charge_level: Schema.Number,
	tap_level: Schema.Number,
	tap_bot: Schema.Boolean,
	boost: Schema.Array(Boost),
	boost_time: DateFromTime,
	// "claims": [], ???
	stat: Schema.Struct({
		taps: Schema.Number,
		ref_in: Schema.Number,
		ref_out: Schema.Number,
		ref_cnt: Schema.Number,
		earned: Schema.Number,
		reward: Schema.Number,
		spent: Schema.Number,
	}),
})

export const Login = Schema.Struct({
	access_token: Schema.String,
	player: Player,
})

export const Click = Schema.Struct({
	player: Player,
})
