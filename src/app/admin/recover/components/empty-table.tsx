import { Calendar, ClipboardList } from 'lucide-react'
import { TableCell, TableRow } from '@/components/ui/table'

type EmptyTableProps = {
  type: 'sessions' | 'exams'
  colSpan: number
}

export function EmptyTable({ type, colSpan }: EmptyTableProps) {
  const Icon = type === 'sessions' ? Calendar : ClipboardList
  const title = type === 'sessions' ? 'No sessions found' : 'No practice exams found'
  const description =
    type === 'sessions'
      ? 'Recover sessions will appear here'
      : 'Practice exams will appear here'

  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="rounded-full bg-muted p-2 mb-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs font-medium text-foreground mb-0.5">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}
