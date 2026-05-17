import { randomUUID } from 'crypto'
import type { RowDataPacket } from 'mysql2'
import { getMySqlPool } from '@/lib/mysql'
import { isSupabaseProvider } from '@/lib/database-provider'
import { getSupabaseAdmin } from '@/lib/supabase'

type AuditColumnRow = RowDataPacket & { COLUMN_NAME: string }

type AuditEntry = {
  action: string
  entityType: string
  entityId: string
  actorId?: string | null
  actorRole?: string | null
  actorName?: string | null
  details?: Record<string, unknown> | string | null
}

const COLUMN_SYNONYMS: Record<string, string[]> = {
  id: ['id', 'audit_id', 'uuid'],
  action: ['action', 'action_name', 'event', 'event_name'],
  entityType: ['entity_type', 'resource_type', 'subject_type'],
  entityId: ['entity_id', 'resource_id', 'subject_id'],
  actorId: ['actor_id', 'user_id', 'performed_by', 'created_by'],
  actorRole: ['actor_role', 'role'],
  actorName: ['actor_name', 'user_name', 'performed_by_name'],
  details: ['details', 'metadata', 'payload', 'data', 'message', 'description'],
  createdAt: ['created_at', 'timestamp', 'createdAt'],
}

function normalizeColumns(rows: AuditColumnRow[]) {
  const byName = new Map<string, string>()
  for (const row of rows) {
    byName.set(String(row.COLUMN_NAME).toLowerCase(), row.COLUMN_NAME)
  }

  const resolved: Record<string, string | null> = {}
  for (const [key, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    resolved[key] = synonyms.map((name) => byName.get(name.toLowerCase()) || null).find(Boolean) || null
  }

  return resolved
}

function buildDetails(entry: AuditEntry) {
  if (typeof entry.details === 'string') return entry.details
  return JSON.stringify({
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    actorId: entry.actorId || null,
    actorRole: entry.actorRole || null,
    actorName: entry.actorName || null,
    details: entry.details || null,
  })
}

export async function logAuditEvent(entry: AuditEntry) {
  try {
    if (isSupabaseProvider()) {
      const admin = getSupabaseAdmin()
      const { error } = await admin.from('audit_logs').insert({
        id: randomUUID(),
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        actor_id: entry.actorId || null,
        actor_role: entry.actorRole || null,
        actor_name: entry.actorName || null,
        details: buildDetails(entry),
        created_at: new Date().toISOString(),
      })

      return !error
    }

    const pool = getMySqlPool()
    const [tableRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
         FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = 'audit_logs'`
    )

    if (!tableRows?.[0] || Number((tableRows[0] as any).total || 0) === 0) {
      return false
    }

    const [columnRows] = await pool.query<AuditColumnRow[]>(
      `SELECT COLUMN_NAME
         FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'audit_logs'`
    )

    const columns = normalizeColumns(columnRows)
    const insertColumns: string[] = []
    const values: any[] = []

    const addValue = (columnKey: keyof typeof columns, value: unknown) => {
      const columnName = columns[columnKey]
      if (!columnName || typeof value === 'undefined' || value === null) return
      insertColumns.push(columnName)
      values.push(value)
    }

    addValue('id', randomUUID())
    addValue('action', entry.action)
    addValue('entityType', entry.entityType)
    addValue('entityId', entry.entityId)
    addValue('actorId', entry.actorId || null)
    addValue('actorRole', entry.actorRole || null)
    addValue('actorName', entry.actorName || null)
    addValue('details', buildDetails(entry))
    addValue('createdAt', new Date())

    if (insertColumns.length === 0) return false

    const placeholders = insertColumns.map(() => '?').join(', ')
    await pool.execute(`INSERT INTO audit_logs (${insertColumns.join(', ')}) VALUES (${placeholders})`, values)
    return true
  } catch {
    return false
  }
}

export async function listAuditLogs() {
  try {
    if (isSupabaseProvider()) {
      const admin = getSupabaseAdmin()
      const { data, error } = await admin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)

      if (error) {
        return []
      }

      return data || []
    }

    const pool = getMySqlPool()
    const [tableRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
         FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = 'audit_logs'`
    )

    if (!tableRows?.[0] || Number((tableRows[0] as any).total || 0) === 0) {
      return []
    }

    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM audit_logs LIMIT 500')
    return [...rows]
      .sort((a, b) => {
        const aTime = new Date(String(a.created_at || a.createdAt || a.timestamp || a.time || 0)).getTime()
        const bTime = new Date(String(b.created_at || b.createdAt || b.timestamp || b.time || 0)).getTime()
        return bTime - aTime
      })
      .slice(0, 200)
  } catch {
    return []
  }
}
