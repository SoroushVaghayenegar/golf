"use client";

import posthog from 'posthog-js';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import BookModal from '@/components/BookButtonModal';
import { type TeeTime } from '@/services/teeTimeService';

interface BookButtonProps {
  teeTime: TeeTime;
  numOfPlayersInFilter?: number;
}

export default function BookButton({ teeTime, numOfPlayersInFilter }: BookButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    // Track book modal button click
    posthog.capture('book_modal_button_clicked', {
      course_name: teeTime.course_name,
      tee_time_id: teeTime.id,
      price: teeTime.price,
      available_participants: teeTime.available_participants,
      city: teeTime.city
    });
    
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 w-full h-full"
      >
        Book
      </Button>
      
      <BookModal 
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        teeTime={teeTime}
        numOfPlayersInFilter={numOfPlayersInFilter}
      />
    </>
  );
}
