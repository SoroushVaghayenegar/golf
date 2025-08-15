"use client"

import React, { useState, useMemo, useEffect } from "react"
import Select, { MultiValue, StylesConfig } from 'react-select'
import posthog from 'posthog-js'
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
import { Skeleton } from "@/components/ui/skeleton"
import { createSubscription, fetchCourseDisplayNamesAndTheirCities, fetchRegions } from "@/services/supabaseService"
import { MapPin } from "lucide-react"

interface SelectOption {
  value: string;
  label: string;
  isDisabled?: boolean;
  city?: string;
}

interface SubscriptionSignupProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onDismiss?: () => void
  selectedRegionId: string
}

export function SubscriptionSignup({ isOpen, onOpenChange, onDismiss, selectedRegionId }: SubscriptionSignupProps) {
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

  const [golfDays, setGolfDays] = useState<string[]>([])
  const [timeFrom, setTimeFrom] = useState("05:00")
  const [timeTo, setTimeTo] = useState("22:00")
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [emailDays, setEmailDays] = useState<string[]>([])
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Region and data loading states (initialize with prop value)
  const [localSelectedRegionId, setLocalSelectedRegionId] = useState<string>(selectedRegionId)
  const [regions, setRegions] = useState<{ value: string; label: string }[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [courseCityMapping, setCourseCityMapping] = useState<Record<string, string>>({})
  const [citiesLoading, setCitiesLoading] = useState(false)
  const [coursesLoading, setCoursesLoading] = useState(false)

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

  // Update local region when prop changes
  useEffect(() => {
    setLocalSelectedRegionId(selectedRegionId);
  }, [selectedRegionId]);

  // Fetch regions on component mount
  useEffect(() => {
    const loadRegions = async () => {
      const regions = await fetchRegions();
      setRegions(regions.map((region: { value: number; label: string }) => ({
        value: region.value.toString(),
        label: region.label
      })));
    };
    loadRegions();
  }, []);

  // Fetch cities and courses when region changes
  useEffect(() => {
    const loadCitiesAndCourses = async () => {
      setCitiesLoading(true);
      setCoursesLoading(true);
      
      // Clear selected cities and courses when region changes
      setSelectedCities([]);
      setSelectedCourses([]);
      
      try {
        const courseCityData = await fetchCourseDisplayNamesAndTheirCities(localSelectedRegionId);
        
        if (!courseCityData || typeof courseCityData !== 'object') {
          throw new Error('Invalid data format received from API');
        }
        
        const cityNames = [...new Set(Object.values(courseCityData).map((course: unknown) => (course as { courseId: number; city: string }).city))].sort((a: string, b: string) => a.localeCompare(b));
        
        // Create simple course name to city name mapping for local use
        const simpleCityMapping: Record<string, string> = {};
        Object.entries(courseCityData).forEach(([courseName, courseData]) => {
          simpleCityMapping[courseName] = (courseData as { courseId: number; city: string }).city;
        });
        
        setCourseCityMapping(simpleCityMapping);
        setCities(cityNames);
      } catch (error) {
        console.error('Failed to fetch cities or courses:', error);
        setCourseCityMapping({});
        setCities([]);
      } finally {
        setCitiesLoading(false);
        setCoursesLoading(false);
      }
    };

    loadCitiesAndCourses();
  }, [localSelectedRegionId]);

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

  // Custom styles for React Select with green colors
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
        borderColor: '#166534', // green-800
        boxShadow: '0 0 0 2px rgba(22, 101, 52, 0.1)' // green-800 with opacity
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#64748b'
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#166534', // green-800
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
        backgroundColor: '#15803d', // green-700
        color: 'white'
      }
    }),
    option: (provided, state) => ({
      ...provided,
      color: state.isDisabled ? '#9ca3af' : provided.color,
      backgroundColor: state.isDisabled 
        ? '#f9fafb' 
        : state.isSelected 
          ? '#166534' // green-800
          : state.isFocused 
            ? '#f0fdf4' // green-50
            : 'white',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      opacity: state.isDisabled ? 0.6 : 1,
      '&:hover': {
        backgroundColor: state.isDisabled 
          ? '#f9fafb' 
          : state.isSelected 
            ? '#166534' // green-800
            : '#f0fdf4' // green-50
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
    posthog.capture('subscription-form-dismissed', {
      region: localSelectedRegionId,
      golf_days_count: golfDays.length,
      selected_cities_count: selectedCities.length,
      selected_courses_count: selectedCourses.length,
      email_days_count: emailDays.length,
      email_field_filled: email.trim().length > 0,
    })
    sessionStorage.setItem('subscription-dismissed', 'true')
    if (onDismiss) {
      onDismiss()
    }
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    // Email validation
    const emailRegex = /^[^\[s@]+@\[^\s@]+\.\[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      alert("Please enter a valid email address")
      return
    }
    
    if (golfDays.length === 0 || selectedCourses.length === 0 || emailDays.length === 0) {
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
        region_id: localSelectedRegionId,
      })
      
      posthog.capture('subscription-created', {
        region: regions.find(region => region.value === localSelectedRegionId)?.label || '',
        golf_days_count: golfDays.length,
        selected_cities_count: selectedCities.length,
        selected_courses_count: selectedCourses.length,
        email_days_count: emailDays.length,
        time_from: timeFrom,
        time_to: timeTo,
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
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-gray-600" />
              <label className="font-semibold">Region</label>
            </div>
            <ShadcnSelect value={localSelectedRegionId} onValueChange={setLocalSelectedRegionId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </ShadcnSelect>
          </div>

          <div>
            <label className="font-semibold">
              Select your cities{selectedCities.length > 0 ? ` (${selectedCities.length})` : ''}
            </label>
            <div className="mt-2">
              {citiesLoading ? (
                <Skeleton className="h-[42px] w-full rounded-lg" />
              ) : (
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  options={cityOptions}
                  value={cityOptions.filter(option => selectedCities.includes(option.value))}
                  onChange={handleCityChange}
                  placeholder="Select cities..."
                  isSearchable
                  noOptionsMessage={() => "No cities found"}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  instanceId="subscription-cities-select"
                  {...commonSelectProps}
                />
              )}
            </div>
          </div>

          <div>
            <label className="font-semibold">
              Select your courses{selectedCourses.length > 0 ? ` (${selectedCourses.length})` : ''}
            </label>
            <div className="mt-2">
              {coursesLoading ? (
                <Skeleton className="h-[42px] w-full rounded-lg" />
              ) : (
                <Select
                  isMulti
                  closeMenuOnSelect={false}
                  options={courseOptions}
                  value={courseOptions.filter(option => selectedCourses.includes(option.value))}
                  onChange={handleCourseChange}
                  placeholder="Select courses..."
                  isSearchable
                  noOptionsMessage={() => "No courses found"}
                  isOptionDisabled={(option) => option.isDisabled || false}
                  styles={selectStyles}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  instanceId="subscription-courses-select"
                  {...commonSelectProps}
                />
              )}
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
