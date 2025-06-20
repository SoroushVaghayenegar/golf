"use client"

import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createSubscription } from "@/services/subscriptionService"

interface SubscriptionSignupProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: () => void
}

export function SubscriptionSignup({ isOpen, onOpenChange, onDismiss }: SubscriptionSignupProps) {
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const cities = ["Pitt Meadows", "Langley", "Coquitlam", "Richmond", "Surrey", "Furry Creek", "Vancouver", "Burnaby"]
  
  const [golfDays, setGolfDays] = useState<string[]>([])
  const [timeFrom, setTimeFrom] = useState("05:00")
  const [timeTo, setTimeTo] = useState("22:00")
  const [selectedCities, setSelectedCities] = useState<string[]>(cities)
  const [emailDays, setEmailDays] = useState<string[]>([])
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const timeOptions = useMemo(() => {
    const options = []
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour = h.toString().padStart(2, '0')
        const minute = m.toString().padStart(2, '0')
        const time = `${hour}:${minute}`
        const ampm = h < 12 ? 'AM' : 'PM'
        const displayHour = h % 12 === 0 ? 12 : h % 12
        const displayTime = `${displayHour}:${minute} ${ampm}`
        options.push({ value: time, label: displayTime })
      }
    }
    return options
  }, [])

  const handleGolfDayChange = (day: string) => {
    setGolfDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleEmailDayChange = (day: string) => {
    setEmailDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleCityChange = (city: string) => {
    setSelectedCities(prev => 
      prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]
    )
  }

  const handleAllCitiesChange = () => {
    if (selectedCities.length === cities.length) {
      setSelectedCities([])
    } else {
      setSelectedCities(cities)
    }
  }

  const handleNoThanks = () => {
    localStorage.setItem('subscription-dismissed', 'true')
    if (onDismiss) {
      onDismiss()
    }
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!email || golfDays.length === 0 || selectedCities.length === 0 || emailDays.length === 0) {
      alert("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      await createSubscription({
        email,
        day_list: golfDays,
        start_time: timeFrom,
        end_time: timeTo,
        city_list: selectedCities,
        broadcast_day_list: emailDays,
      })
      
      // Set localStorage to dismiss the subscription dialog
      localStorage.setItem('subscription-dismissed', 'true')
      
      // Close the dialog on success
      onOpenChange(false)
      alert("Subscription created successfully!")
    } catch (error) {
      console.error("Failed to create subscription:", error)
      alert("Failed to create subscription. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange }>
      <DialogContent showCloseButton={false} className="max-h-[90vh] md:max-h-[70vh] md:max-w-3xl md:w-[700px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Never Miss the Perfect Tee Time Again</DialogTitle>
          <DialogDescription className="text-center">
            Get a weekly roundup of open tee times at your favorite courses — straight to your inbox. Whether you&apos;re booking last-minute or planning ahead, we&apos;ll save you the scroll. Quick, local, and totally free.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 md:space-y-3">
          <div>
            <label className="font-semibold">Which days do you want to golf?</label>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {weekDays.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`golf-day-${day}`} 
                    checked={golfDays.includes(day)}
                    onCheckedChange={() => handleGolfDayChange(day)}
                  />
                  <label htmlFor={`golf-day-${day}`}>{day}</label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold">Preferred tee time range</label>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label htmlFor="from-time" className="text-sm text-gray-500">From</label>
                <Select value={timeFrom} onValueChange={setTimeFrom}>
                  <SelectTrigger id="from-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(option => (
                      <SelectItem key={`from-${option.value}`} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="to-time" className="text-sm text-gray-500">To</label>
                <Select value={timeTo} onValueChange={setTimeTo}>
                  <SelectTrigger id="to-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(option => (
                      <SelectItem key={`to-${option.value}`} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold">Select your cities</label>
            <div className="border rounded-md p-2 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all-cities" 
                  checked={selectedCities.length === cities.length}
                  onCheckedChange={handleAllCitiesChange}
                />
                <label htmlFor="all-cities">ALL ({selectedCities.length} of {cities.length} selected)</label>
              </div>
              <hr className="my-2"/>
              <div className="grid grid-cols-2 gap-2">
                {cities.map(city => (
                  <div key={city} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`city-${city}`} 
                      checked={selectedCities.includes(city)}
                      onCheckedChange={() => handleCityChange(city)}
                    />
                    <label htmlFor={`city-${city}`}>{city}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold">Which days do you want to receive emails?</label>
            <div className="grid grid-cols-4 gap-2 pt-2">
              {weekDays.map(day => (
                <div key={day} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`email-day-${day}`}
                    checked={emailDays.includes(day)}
                    onCheckedChange={() => handleEmailDayChange(day)}
                  />
                  <label htmlFor={`email-day-${day}`}>{day}</label>
                </div>
              ))}
            </div>
          </div>

          <Input 
            type="email" 
            placeholder="your@email.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button 
            className="w-full bg-black hover:bg-black/80 text-white font-bold py-2 px-4 rounded"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Get My Weekly Tee Times →"}
          </Button>
          <Button variant="link" className="w-full text-gray-500" onClick={handleNoThanks}>
            No thanks
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
