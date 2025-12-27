import { Users } from 'lucide-react'

export function EmptyUserList({ isSearching = false }: { isSearching?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Users className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        {isSearching ? 'No matching users' : 'No Recover chats found'}
      </p>
      <p className="text-xs text-muted-foreground max-w-[200px]">
        {isSearching
          ? 'Try adjusting your search terms'
          : 'Users will appear here once they start using Recover'}
      </p>
    </div>
  )
}
