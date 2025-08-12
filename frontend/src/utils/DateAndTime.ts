export function getTeeTime(dateTimeString: string) {
    const time = dateTimeString.split('T')[1]
    const hours = time.split(':')[0]
    const minutes = time.split(':')[1]
    
    // Determine if the time is AM or PM
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM'
    const hours12 = parseInt(hours) % 12 || 12
    return `${hours12}:${minutes} ${ampm}`
}