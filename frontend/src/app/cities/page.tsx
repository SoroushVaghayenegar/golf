'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What are the most affordable golf courses in Vancouver?",
    answer: "The most affordable golf courses in Vancouver are <strong>Langara Golf Course</strong> and <strong>McCleery Golf Course</strong>, especially if you book twilight tee times. <strong>Musqueam Golf Course</strong> also offers good value and is popular with beginners and learners."
  },
  {
    question: "What are the best golf courses in Vancouver for beginners?",
    answer: "The best beginner-friendly golf courses in Vancouver are:\n\n<strong>Langara</strong>: forgiving fairways, shorter layout, and flat terrain make it beginner-friendly.\n\n<strong>Musqueam</strong>: specifically geared toward beginners and practice, with a large driving range, pitch-and-putt, and approachable course design.\n\n👉 Between the two, <strong>Musqueam</strong> is often the most beginner-oriented."
  },
  {
    question: "What is the longest golf course in Vancouver?",
    answer: "The longest golf course in Vancouver is <strong>Fraserview Golf Course</strong>, measuring over 6,700 yards from the tips. <strong>University Golf Club</strong> is also a full-length championship course (just under 6,400 yards) and offers one of the city's most challenging public layouts."
  },
  {
    question: "Which golf courses in Vancouver are easiest to walk?",
    answer: "The most walkable golf courses in Vancouver are:\n\n<strong>Langara</strong>: the flattest and easiest to walk.\n\n<strong>McCleery</strong>: mostly flat and walkable.\n\n<strong>University Golf Club</strong>: generally walkable, with gentle terrain.\n\n<strong>Musqueam</strong>: short and approachable, ideal for casual walking rounds.\n\n<strong>Fraserview</strong>: the hilliest course in Vancouver and the most demanding to walk."
  },
  {
    question: "How far in advance can you book golf tee times in Vancouver?",
    answer: "Vancouver municipal golf courses (<strong>Fraserview</strong>, <strong>Langara</strong>, <strong>McCleery</strong>) allow tee time bookings up to 30 days in advance.\n\n<strong>Musqueam Golf Course</strong> and <strong>University Golf Club</strong> typically allow tee time bookings 7 days in advance online or by phone."
  },
  {
    question: "Is golf in Vancouver available year-round?",
    answer: "Yes. Golf in Vancouver is available nearly 12 months of the year. Thanks to the city's mild coastal climate, <strong>Fraserview</strong>, <strong>Langara</strong>, <strong>McCleery</strong>, <strong>Musqueam</strong>, and <strong>University Golf Club</strong> all remain open year-round, with only rare closures due to snow, frost, or heavy rain."
  }
]

function FAQAccordionItem({ item, isOpen, onToggle }: { 
  item: FAQItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-amber-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-amber-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-inset"
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-4">
          {item.question}
        </h3>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-600" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="px-6 pb-6 pt-2">
          <div className="prose prose-gray max-w-none">
            {item.answer.split('\n\n').map((paragraph, index) => (
              <p 
                key={index} 
                className="text-gray-600 mb-4 last:mb-0 whitespace-pre-line"
                dangerouslySetInnerHTML={{ __html: paragraph }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function CitiesPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number>(0) // First item open by default

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  const getVancouverDate = () => {
    // Get current date/time in Vancouver timezone (Pacific Time)
    const now = new Date();
    const vancouverTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Vancouver"}));
    
    // If it's after 9 PM (21:00), add one day
    if (vancouverTime.getHours() >= 21) {
      vancouverTime.setDate(vancouverTime.getDate() + 1);
    }
    
    // Format as YYYY-MM-DD
    return vancouverTime.toISOString().split('T')[0];
  };

  const handleBrowseTeeTimesClick = () => {
    const searchDate = getVancouverDate();
    const searchUrl = `/search?dates=${searchDate}&players=any&holes=any&timeRange=5-22&region=1&sort=startTime&courseIds=1%2C2%2C3%2C21%2C23&cities=Vancouver`;
    router.push(searchUrl);
  };

  const courses = [
    {
      id: 2,
      name: "Fraserview Golf Course",
      description: "Championship layout with tree-lined fairways and Fraser River views.",
      image: "/Fraserview.png",
      courseIds: "2"
    },
    {
      id: 3,
      name: "Langara Golf Course", 
      description: "Central, walkable course that's great for beginners and casual rounds.",
      image: "/Langara.png",
      courseIds: "3"
    },
    {
      id: 1,
      name: "McCleery Golf Course",
      description: "Narrow fairways and a strategic design along the Fraser River.",
      image: "/McCleery.png",
      courseIds: "1"
    },
    {
      id: 23,
      name: "Musqueam Golf & Learning Academy", 
      description: "Short, friendly layout with a large driving range and practice facilities, ideal for learners and quick rounds.",
      image: "/Musqueam.png",
      courseIds: "23"
    },
    {
      id: 21,
      name: "University Golf Club",
      description: "Classic parkland course near Pacific Spirit Park, known for its walkability and year-round play.",
      image: "/University.png",
      courseIds: "21"
    }
  ];

  const handleCourseTeeTimesClick = (course: typeof courses[0]) => {
    const searchDate = getVancouverDate();
    const searchUrl = `/search?dates=${searchDate}&players=any&holes=any&timeRange=5-22&region=1&sort=startTime&courseIds=${course.courseIds}&cities=Vancouver`;
    router.push(searchUrl);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-200 to-amber-100 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Tee Times in Vancouver
          </h1>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            Looking to book golf in Vancouver? TeeClub makes it easy to see available tee times across 
            the city&apos;s top public courses, including Fraserview, Langara, and McCleery. From 
            championship layouts to quick nine-hole rounds, you can explore what&apos;s nearby and then 
            book directly on the course website. Vancouver&apos;s mild climate also means golfers can enjoy 
            tee times year-round.
          </p>
          <button 
            onClick={handleBrowseTeeTimesClick}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors duration-200"
          >
            Browse All Vancouver Tee Times
          </button>
        </div>
      </div>
      
      {/* Vancouver Golf Courses Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Vancouver Golf Courses
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore Vancouver&apos;s premier public golf courses, from championship layouts to 
            beginner-friendly courses, each offering unique challenges and beautiful scenery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden"
            >
              {/* Course Image */}
              <div className="relative w-full h-40 md:h-56 lg:h-64">
                <Image
                  src={course.image}
                  alt={course.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Course Content */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {course.name}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {course.description}
                </p>
                
                {/* See Tee Times Button */}
                <button
                  onClick={() => handleCourseTeeTimesClick(course)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <span>🏌️</span>
                  See {course.name.split(' ')[0]} Tee Times
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-slate-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about golf courses in Vancouver, 
              tee time bookings, and more.
            </p>
          </div>
          
          <div className="space-y-4">
            {faqData.map((item, index) => (
              <FAQAccordionItem
                key={index}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => handleToggle(index)}
              />
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-900 mb-3">
                Still have questions?
              </h3>
              <p className="text-green-700 mb-4">
                Can&apos;t find what you&apos;re looking for? Get in touch with us and we&apos;ll be happy to help.
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
