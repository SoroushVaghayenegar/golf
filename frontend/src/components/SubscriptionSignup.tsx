"use client"

import React, { useState, useMemo } from "react"
import Select, { MultiValue, StylesConfig } from 'react-select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createSubscription } from "@/services/supabaseService"

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  city?: string;
}

interface SubscriptionSignupProps {
  courseCityMapping: Record<string, string>
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: () => void
}

export function SubscriptionSignup({ courseCityMapping, isOpen, onOpenChange, onDismiss }: SubscriptionSignupProps) {
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  
  // Extract cities and courses from courseCityMapping
  const cities = useMemo(() => {
    const uniqueCities = [...new Set(Object.values(courseCityMapping))].sort()
    return uniqueCities
  }, [courseCityMapping])



  const [golfDays, setGolfDays] = useState<string[]>([])
  const [timeFrom, setTimeFrom] = useState("05:00")
  const [timeTo, setTimeTo] = useState("22:00")
  const [selectedCities, setSelectedCities] = useState<string[]>(cities)
  const [selectedCourses, setSelectedCourses] = useState<string[]>(Object.keys(courseCityMapping))
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

  // Convert cities and courses to react-select format
  const cityOptions = cities.map(city => ({
    value: city, 
    label: city
  }));
  
  const courseOptions = Object.keys(courseCityMapping).map(course => {
    const courseCity = courseCityMapping[course];
    const isDisabled = selectedCities.length > 0 && !selectedCities.includes(courseCity);
    return { 
      value: course, 
      label: course, 
      isDisabled: isDisabled,
      city: courseCity 
    };
  });

  // Custom styles for React Select with black colors
  const selectStyles: StylesConfig<SelectOption, true> = {
    control: (provided) => ({
      ...provided,
      minHeight: '42px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      '&:hover': {
        borderColor: '#cbd5e0'
      },
      '&:focus-within': {
        borderColor: '#000000',
        boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.1)'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#64748b'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#000000',
      borderRadius: '4px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '12px'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#374151',
        color: 'white'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#9ca3af' : provided.color,
      backgroundColor: state.isDisabled 
        ? '#f9fafb' 
        : state.isSelected 
          ? '#000000' 
          : state.isFocused 
            ? '#f3f4f6' 
            : 'white',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.6 : 1,
      '&:hover': {
        backgroundColor: state.isDisabled 
          ? '#f9fafb' 
          : state.isSelected 
            ? '#000000' 
            : '#f3f4f6'
      }
    })
  };

  // Common props for React Select to fix aria-activedescendant issue
  const commonSelectProps = {
    'aria-activedescendant': '',
    inputProps: {
      'aria-activedescendant': ''
    }
  };

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

  // Handle city selection changes
  const handleCityChange = (selectedOptions: MultiValue<SelectOption>) => {
    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    const previousCities = selectedCities;
    setSelectedCities(values);
    
    // Find newly added cities
    const addedCities = values.filter(city => !previousCities.includes(city));
    
    // Find courses that belong to the newly added cities
    const coursesToAdd = addedCities.length > 0 
      ? Object.keys(courseCityMapping).filter(courseName => 
          addedCities.includes(courseCityMapping[courseName])
        )
      : [];
    
    // Update selected courses
    if (values.length > 0) {
      // Add courses from newly selected cities and keep courses from still-selected cities
      const updatedCourses = [
        ...new Set([
          ...selectedCourses.filter(courseName => {
            const courseCity = courseCityMapping[courseName];
            return courseCity && values.includes(courseCity);
          }),
          ...coursesToAdd
        ])
      ];
      setSelectedCourses(updatedCourses);
    } else {
      // If no cities are selected, clear all courses
      setSelectedCourses([]);
    }
  };

  // Handle course selection changes
  const handleCourseChange = (selectedOptions: MultiValue<SelectOption>) => {
    const values = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    setSelectedCourses(values);
    
    // Remove selected cities that don't have any of the selected courses
    if (values.length > 0) {
      const validCities = [...new Set(values.map(courseName => courseCityMapping[courseName]).filter(Boolean))];
      const filteredCities = selectedCities.filter(cityName => validCities.includes(cityName));
      if (filteredCities.length !== selectedCities.length) {
        setSelectedCities(filteredCities);
      }
    }
  };

  const handleNoThanks = () => {
    sessionStorage.setItem('subscription-dismissed', 'true')
    if (onDismiss) {
      onDismiss()
    }
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!email || golfDays.length === 0 || selectedCourses.length === 0 || emailDays.length === 0) {
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
        course_list: selectedCourses,
        broadcast_day_list: emailDays,
      })
      
      // Set sessionStorage to dismiss the subscription dialog
      sessionStorage.setItem('subscription-dismissed', 'true')
      
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
                <ShadcnSelect value={timeFrom} onValueChange={setTimeFrom}>
                  <SelectTrigger id="from-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(option => (
                      <SelectItem key={`from-${option.value}`} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </ShadcnSelect>
              </div>
              <div>
                <label htmlFor="to-time" className="text-sm text-gray-500">To</label>
                <ShadcnSelect value={timeTo} onValueChange={setTimeTo}>
                  <SelectTrigger id="to-time">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeOptions.map(option => (
                      <SelectItem key={`to-${option.value}`} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </ShadcnSelect>
              </div>
            </div>
          </div>

          <div>
            <label className="font-semibold">
              Select your cities{selectedCities.length > 0 ? ` (${selectedCities.length})` : ''}
            </label>
            <div className="mt-2">
              <Select
                isMulti
                closeMenuOnSelect={false}
                options={cityOptions}
                value={cityOptions.filter(option => selectedCities.includes(option.value))}
                onChange={handleCityChange}
                placeholder="Select cities..."
                isSearchable
                styles={selectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                instanceId="subscription-cities-select"
                {...commonSelectProps}
              />
            </div>
          </div>

          <div>
            <label className="font-semibold">
              Select your courses{selectedCourses.length > 0 ? ` (${selectedCourses.length})` : ''}
            </label>
            <div className="mt-2">
              <Select
                isMulti
                closeMenuOnSelect={false}
                options={courseOptions}
                value={courseOptions.filter(option => selectedCourses.includes(option.value))}
                onChange={handleCourseChange}
                placeholder="Select courses..."
                isSearchable
                isOptionDisabled={(option) => option.isDisabled || false}
                styles={selectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
                instanceId="subscription-courses-select"
                {...commonSelectProps}
              />
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
            disabled={isSubmitting || selectedCourses.length === 0 || golfDays.length === 0 || emailDays.length === 0 || !email.trim()}
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
