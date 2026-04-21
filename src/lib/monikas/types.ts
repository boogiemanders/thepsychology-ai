// Monikas — shared TS types that mirror the Supabase schema.
// Kept in sync manually with ios/MonikasHost/MonikasHost/Models/MonikasModels.swift.
// Postgres snake_case → TS camelCase in API route responses (mapper below).

export type RoomStatus = 'lobby' | 'in_progress' | 'paused' | 'completed'
export type JoinType = 'host_device' | 'web_player'
export type AvatarType = 'preset' | 'drawing' | 'preset_plus_drawing'
export type CardSource = 'user' | 'fallback'
export type CardLifecycle = 'unplayed' | 'guessed' | 'skipped' | 'removed'
export type VoteType = 'legend' | 'broke_the_room'
export type ActingCategory = 'character' | 'impression' | 'costume' | 'mood'
export type RecapTrigger =
  | 'many_skips'
  | 'zero_guesses'
  | 'fast_success'
  | 'total_panic'
  | 'obvious_misplay'
  | 'miracle_comeback'

export interface Room {
  id: string
  roomCode: string
  status: RoomStatus
  hostPlayerId: string | null
  timerSeconds: number
  currentRound: number
  currentTeam: number
  currentTurnIndex: number
  activeActorPlayerId: string | null
  publicDisplayConnected: boolean
  characterModeEnabled: boolean
  callbackModeEnabled: boolean
  suddenDeathEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Player {
  id: string
  roomId: string
  displayName: string
  joinType: JoinType
  team: number
  turnOrder: number
  isConnected: boolean
  lastSeenAt: string
  avatarType: AvatarType | null
  presetAvatarId: string | null
  avatarImageUrl: string | null
  legendVotesRemaining: number
  createdAt: string
}

/** Public-safe player shape. Never includes player_token. */
export type PublicPlayer = Omit<Player, never>

export interface Card {
  id: string
  roomId: string
  submittedByPlayerId: string | null
  originalText: string
  normalizedText: string
  secretNote: string | null
  sourceType: CardSource
  deckOrder: number
  lifecycleState: CardLifecycle
  guessedByTeam: number | null
  roundNumberLastSeen: number | null
  isLegend: boolean
  isBrokeTheRoom: boolean
  callbackEligible: boolean
  createdAt: string
}

/** Card shape without secret text — safe to broadcast on realtime. */
export interface CardMeta {
  id: string
  roomId: string
  sourceType: CardSource
  deckOrder: number
  lifecycleState: CardLifecycle
  guessedByTeam: number | null
  isLegend: boolean
  isBrokeTheRoom: boolean
  callbackEligible: boolean
}

export interface Turn {
  id: string
  roomId: string
  playerId: string
  roundNumber: number
  team: number
  activeModifierId: string | null
  recapLineCode: string | null
  startedAt: string
  endedAt: string | null
  cardsGuessedCount: number
  cardsSkippedCount: number
}

export interface PresetAvatar {
  id: string
  name: string
  imageUrl: string
  sortOrder: number
}

export interface ActingModifier {
  id: string
  code: string
  label: string
  description: string | null
  category: ActingCategory
}

export interface RecapLine {
  id: string
  code: string
  label: string
  triggerType: RecapTrigger
}

export interface CardSuggestionPrompt {
  id: string
  text: string
  category: string
}

// -------------------------------------------------------------------
// API request/response shapes
// -------------------------------------------------------------------

export interface CreateRoomRequest {
  hostName: string
  timerSeconds?: number
}

export interface CreateRoomResponse {
  room: Room
  player: Player
  playerToken: string
}

export interface JoinRoomRequest {
  displayName: string
  joinType?: JoinType
}

export interface JoinRoomResponse {
  room: Room
  player: Player
  playerToken: string
}

export interface GetRoomResponse {
  room: Room
  players: Player[]
  cardCounts?: Record<string, number>
}

// -------------------------------------------------------------------
// Domain events (for the engine; just a taxonomy right now)
// -------------------------------------------------------------------

export type MonikasEvent =
  | { type: 'room_created'; roomId: string; roomCode: string }
  | { type: 'player_joined'; roomId: string; playerId: string }
  | { type: 'player_reconnected'; roomId: string; playerId: string }
  | { type: 'avatar_selected'; playerId: string; presetAvatarId: string }
  | { type: 'avatar_drawn'; playerId: string; imageUrl: string }
  | { type: 'card_submitted'; cardId: string; playerId: string }
  | { type: 'fallback_cards_added'; roomId: string; count: number }
  | { type: 'deck_shuffled'; roomId: string }
  | { type: 'game_started'; roomId: string }
  | { type: 'turn_started'; turnId: string }
  | { type: 'card_guessed'; cardId: string; turnId: string }
  | { type: 'card_skipped'; cardId: string; turnId: string }
  | { type: 'clue_requested'; cardId: string }
  | { type: 'quote_saved'; quoteId: string }
  | { type: 'legend_vote_cast'; cardId: string; playerId: string }
  | { type: 'broke_the_room_marked'; cardId: string }
  | { type: 'recap_line_selected'; turnId: string; code: string }
  | { type: 'turn_ended'; turnId: string }
  | { type: 'round_recap_generated'; roundNumber: number }
  | { type: 'round_advanced'; roundNumber: number }
  | { type: 'callback_card_inserted'; cardId: string }
  | { type: 'sudden_death_started'; roomId: string }
  | { type: 'game_paused'; roomId: string }
  | { type: 'game_resumed'; roomId: string }
  | { type: 'game_saved'; roomId: string }
  | { type: 'game_completed'; roomId: string }

// -------------------------------------------------------------------
// Postgres row → app shape mappers.
// Keep this next to the types so they stay in sync.
// -------------------------------------------------------------------

type RoomRow = {
  id: string
  room_code: string
  status: RoomStatus
  host_player_id: string | null
  timer_seconds: number
  current_round: number
  current_team: number
  current_turn_index: number
  active_actor_player_id: string | null
  public_display_connected: boolean
  character_mode_enabled: boolean
  callback_mode_enabled: boolean
  sudden_death_enabled: boolean
  created_at: string
  updated_at: string
}

export function mapRoom(row: RoomRow): Room {
  return {
    id: row.id,
    roomCode: row.room_code,
    status: row.status,
    hostPlayerId: row.host_player_id,
    timerSeconds: row.timer_seconds,
    currentRound: row.current_round,
    currentTeam: row.current_team,
    currentTurnIndex: row.current_turn_index,
    activeActorPlayerId: row.active_actor_player_id,
    publicDisplayConnected: row.public_display_connected,
    characterModeEnabled: row.character_mode_enabled,
    callbackModeEnabled: row.callback_mode_enabled,
    suddenDeathEnabled: row.sudden_death_enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

type PlayerRow = {
  id: string
  room_id: string
  display_name: string
  join_type: JoinType
  team: number
  turn_order: number
  is_connected: boolean
  last_seen_at: string
  avatar_type: AvatarType | null
  preset_avatar_id: string | null
  avatar_image_url: string | null
  legend_votes_remaining: number
  created_at: string
}

export function mapPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    roomId: row.room_id,
    displayName: row.display_name,
    joinType: row.join_type,
    team: row.team,
    turnOrder: row.turn_order,
    isConnected: row.is_connected,
    lastSeenAt: row.last_seen_at,
    avatarType: row.avatar_type,
    presetAvatarId: row.preset_avatar_id,
    avatarImageUrl: row.avatar_image_url,
    legendVotesRemaining: row.legend_votes_remaining,
    createdAt: row.created_at,
  }
}
