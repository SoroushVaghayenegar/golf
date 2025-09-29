'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { FAQItem } from '@/services/cityService';

interface CityFAQComponentProps {
  cityName: string;
  faqs: FAQItem[];
}

function FAQAccordionItem({item, isOpen, onToggle }: { 
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
        <h3 className="text-lg font-semibold text-gray-900 overflow-hidden pr-4">
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

export default function CityFAQComponent({ cityName, faqs }: CityFAQComponentProps) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  if (!faqs || faqs.length === 0) {
    return null; // Don't render anything if no FAQs
  }

  return (
    <div className="bg-slate-100 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Find answers to common questions about golf courses in {cityName}, tee time bookings, and more.
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((item, index) => (
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
  );
}
