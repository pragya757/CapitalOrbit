'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenses } from '@/components/expense-provider'
import { formatCurrency } from '@/lib/format'
import {
  User,
  Download,
  Upload,
  Save,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { RazorpayStatusCard } from '@/components/razorpay-status-card'

const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'SGD', name: 'Singapore Dollar (S$)' },
  { code: 'AED', name: 'UAE Dirham (د.إ)' },
]

export default function SettingsPage() {
  const { user, updateUser, exportToCSV, exportToJSON, importFromCSV, importFromJSON } = useExpenses()
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [currency, setCurrency] = useState(user.currency)
  const [monthlyBudget, setMonthlyBudget] = useState(user.monthlyBudget.toString())
  const [hasChanges, setHasChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonInputRef = useRef<HTMLInputElement>(null)

  const handleFieldChange = (setter: (v: string) => void, value: string) => {
    setter(value)
    setHasChanges(true)
  }

  const handleSave = () => {
    updateUser({
      name,
      email,
      currency,
      monthlyBudget: parseFloat(monthlyBudget) || 0,
    })
    setHasChanges(false)
    toast.success('Settings saved successfully')
  }

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const count = importFromCSV(text)
      toast.success(`Imported ${count} expenses from CSV`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleJSONImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      const success = importFromJSON(text)
      if (success) {
        toast.success('Data restored from backup')
        // Reload to pick up all changes
        window.location.reload()
      } else {
        toast.error('Failed to import — invalid JSON format')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your profile and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleFieldChange(setName, e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleFieldChange(setEmail, e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(v) => handleFieldChange(setCurrency, v)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Monthly Budget</Label>
              <Input
                id="budget"
                type="number"
                value={monthlyBudget}
                onChange={(e) => handleFieldChange(setMonthlyBudget, e.target.value)}
              />
            </div>
          </div>
          {hasChanges && (
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Data Management</CardTitle>
          </div>
          <CardDescription>Export and import your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Export */}
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-medium">Export Data</h4>
              <p className="text-xs text-muted-foreground">
                Download your data for backup or analysis
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="gap-2 justify-start" onClick={exportToCSV}>
                  <FileSpreadsheet className="h-4 w-4" />
                  Export Expenses (CSV)
                </Button>
                <Button variant="outline" size="sm" className="gap-2 justify-start" onClick={exportToJSON}>
                  <FileJson className="h-4 w-4" />
                  Full Backup (JSON)
                </Button>
              </div>
            </div>

            {/* Import */}
            <div className="space-y-3 rounded-lg border p-4">
              <h4 className="text-sm font-medium">Import Data</h4>
              <p className="text-xs text-muted-foreground">
                Import expenses from CSV or restore a JSON backup
              </p>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVImport}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 justify-start"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Import Expenses (CSV)
                </Button>
                <input
                  ref={jsonInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleJSONImport}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 justify-start"
                  onClick={() => jsonInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Restore Backup (JSON)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Razorpay Integration Foundation Status */}
      <RazorpayStatusCard />

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure? This will delete ALL your data permanently.')) {
                localStorage.clear()
                window.location.reload()
              }
            }}
          >
            Clear All Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
