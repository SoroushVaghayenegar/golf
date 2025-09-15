'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CitiesPage() {
  const router = useRouter();

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
    </div>
  );
}
