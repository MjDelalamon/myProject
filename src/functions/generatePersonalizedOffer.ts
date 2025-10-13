export const generatePersonalizedOffer = (topCategory: string | null) => {
  const offers: Record<string, string> = {
    Coffee: "Get 20% off your next coffee!",
    Beef: "Buy 1 Get 1 on all Beef dishes!",
    Chicken: "Free drink with every Chicken meal!",
    Pasta: "Earn double points on all Pasta orders!",
  };

  return offers[topCategory || ""] || "Enjoy 10% off your next visit!";
};
