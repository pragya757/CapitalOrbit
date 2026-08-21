'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useExpenses } from '@/components/expense-provider'
import { getCategoryIcon, getCategoryLabel, DEFAULT_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Shield,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function CategoryManager() {
  const { categories, addCategory, removeCategory } = useExpenses()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = () => {
    const name = newCategoryName.trim().toLowerCase()
    if (!name) return

    const result = addCategory(name)
    if (result) {
      toast.success('Category Created!', {
        description: `"${getCategoryLabel(name)}" has been added to your categories.`,
      })
      setNewCategoryName('')
      setIsAdding(false)
    } else {
      toast.error('Category Exists', {
        description: `"${getCategoryLabel(name)}" already exists!`,
      })
    }
  }

  const handleDelete = (name: string) => {
    if ((DEFAULT_CATEGORIES as string[]).includes(name)) {
      toast.error('Cannot Delete', {
        description: 'Default categories cannot be removed.',
      })
      return
    }
    const success = removeCategory(name)
    if (success) {
      toast.success('Category Removed', {
        description: `"${getCategoryLabel(name)}" has been deleted.`,
      })
    }
  }

  const defaultCats = categories.filter((c) => !c.isCustom)
  const customCats = categories.filter((c) => c.isCustom)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Manage Categories</CardTitle>
            <CardDescription>Add or remove custom expense categories</CardDescription>
          </div>
          {!isAdding && (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4" />
              New Category
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new category input */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                <Input
                  placeholder="Category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  className="flex-1"
                  autoFocus
                />
                <Button size="sm" onClick={handleAdd} disabled={!newCategoryName.trim()}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false)
                    setNewCategoryName('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Default categories (protected) */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Default Categories
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {defaultCats.map((cat) => {
              const Icon = getCategoryIcon(cat.name)
              return (
                <div
                  key={cat.name}
                  className="flex items-center gap-2 rounded-xl border p-2.5 bg-muted/30"
                >
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{getCategoryLabel(cat.name)}</span>
                  <Shield className="h-3 w-3 text-muted-foreground/50 ml-auto shrink-0" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Custom categories (deletable) */}
        {customCats.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Custom Categories
            </p>
            <div className="space-y-2">
              <AnimatePresence>
                {customCats.map((cat) => {
                  const Icon = getCategoryIcon(cat.name)
                  return (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      className="flex items-center gap-3 rounded-xl border p-3 group hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Tag className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium flex-1">{getCategoryLabel(cat.name)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(cat.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete {getCategoryLabel(cat.name)}</span>
                      </Button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}

        {customCats.length === 0 && !isAdding && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No custom categories yet.</p>
            <p className="text-xs mt-1">Click "New Category" to create one.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
