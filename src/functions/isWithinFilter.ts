export const isWithinFilter = (date: Date, filter: string): boolean => {
  const now = new Date();
  const today = new Date(now.toDateString());
  const target = new Date(date.toDateString());

  if (filter === "today") {
    return target.getTime() === today.getTime();
  } else if (filter === "week") {
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return target >= startOfWeek && target <= now;
  } else if (filter === "month") {
    return (
      target.getMonth() === today.getMonth() &&
      target.getFullYear() === today.getFullYear()
    );
  }
  return false;
};
