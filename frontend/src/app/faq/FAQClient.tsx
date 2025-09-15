'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

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

export default function FAQClient() {
  const [openIndex, setOpenIndex] = useState<number>(0) // First item open by default

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-slate-100">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
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
  )
}
