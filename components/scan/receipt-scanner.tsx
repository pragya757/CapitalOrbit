'use client'

import { useState, useRef } from 'react'
import { processReceiptImage, type ParsedReceipt } from '@/lib/ocr'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AnimatedButton } from '@/components/auth/animated-button'
import { useExpenses } from '@/components/expense-provider'
import { Upload, Camera, FileText, CheckCircle2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { getCategoryLabel, DEFAULT_CATEGORIES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function ReceiptScanner() {
  const { addExpense, categories } = useExpenses()
  
  const [file, setFile] = useState<File | null>(null)
  const [previewSize, setPreviewSize] = useState<{w:number, h:number}>({w:0,h:0})
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [parsedData, setParsedData] = useState<ParsedReceipt | null>(null)
  
  // Editable Fields
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('food')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    setFile(selected)
    setParsedData(null)
    setIsProcessing(true)
    setProgress(0)

    try {
      const result = await processReceiptImage(selected, (p) => setProgress(p))
      
      setParsedData(result)
      
      // Auto-fill form
      setAmount(result.amount ? result.amount.toString() : '')
      setDescription(result.merchantName)
      setDate(result.date || new Date().toISOString().split('T')[0])
      
      if (result.category) {
        setCategory(result.category)
      } else {
        setCategory('food') // default
      }
      
      toast.success('Receipt scanned successfully!')
    } catch (err: any) {
      toast.error('Failed to read receipt', { description: err.message })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSave = () => {
    if (!amount) {
      toast.error('Please enter a valid amount')
      return
    }

    addExpense({
      amount: parseFloat(amount),
      description: description.trim() || 'Scanned Receipt',
      category,
      date,
      paymentMethod: 'card', // default assumption for receipts
      isRecurring: false,
    })

    toast.success('Expense saved to your dashboard!')
    
    // Reset state
    setFile(null)
    setParsedData(null)
    setAmount('')
    setDescription('')
    setDate('')
  }

  const allCategoryNames = categories.map((c) => c.name)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Col: Upload & Preview */}
        <div className="flex-1 space-y-4">
          <Card className="h-full border-dashed bg-card/60 relative overflow-hidden flex flex-col items-center justify-center p-6 min-h-[400px]">
            {file ? (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="relative w-full max-w-[300px] aspect-[3/4] rounded-lg overflow-hidden border shadow-sm">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="Receipt preview" 
                    className="w-full h-full object-cover"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                      <span className="text-sm font-semibold">{Math.round(progress)}%</span>
                      <span className="text-xs text-muted-foreground mt-1 text-center px-4">Analyzing thermal ink...</span>
                    </div>
                  )}
                </div>
                
                {!isProcessing && (
                  <Button variant="outline" size="sm" onClick={() => { setFile(null); setParsedData(null) }}>
                    <X className="h-4 w-4 mr-2" /> Clear Image
                  </Button>
                )}
              </div>
            ) : (
              <div 
                className="flex flex-col items-center text-center cursor-pointer p-12 w-full h-full justify-center group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">Upload Receipt</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Take a photo of a receipt or upload an image file structure it automatically.
                </p>
                <Button className="mt-8" variant="secondary">
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </Button>
              </div>
            )}
            <Input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </Card>
        </div>

        {/* Right Col: Extracted Data Form */}
        <div className="flex-1">
          <Card className="h-full border-white/20 dark:border-white/10 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-500" />
                Extracted Expense
              </CardTitle>
              <CardDescription>
                Verify and edit the OCR inputs before saving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parsedData ? (
                 <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Total Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      className="text-xl font-bold h-12"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="merchant">Merchant / Description</Label>
                    <Input
                      id="merchant"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategoryNames.map((name) => (
                            <SelectItem key={name} value={name}>
                              {getCategoryLabel(name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <AnimatedButton onClick={handleSave} className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Save Expense
                    </AnimatedButton>
                  </div>
                 </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center opacity-50 space-y-4">
                  <FileText className="h-12 w-12" />
                  <p className="text-sm">Scan a receipt to auto-fill these fields.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
