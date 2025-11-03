import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MapPin, Clock, Phone, Navigation } from "lucide-react";

interface Location {
  id: number;
  name: string;
  type: "branch" | "atm";
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  hours?: string;
  lat: number;
  lng: number;
}

const Locations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "branch" | "atm">("all");

  // VaultBank Brodhead branch location
  const locations: Location[] = [
    {
      id: 1,
      name: "VaultBank Brodhead Branch",
      type: "branch",
      address: "806 E Exchange St",
      city: "Brodhead",
      state: "WI",
      zip: "53520-0108",
      phone: "(608) 555-0100",
      hours: "Mon-Fri 9AM-5PM, Sat 10AM-2PM",
      lat: 42.6194,
      lng: -89.3751
    }
  ];

  const filteredLocations = locations.filter(location => {
    const matchesSearch = 
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.zip.includes(searchQuery);
    
    const matchesFilter = filterType === "all" || location.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find VaultBank Locations</h1>
          <p className="text-xl opacity-90 mb-8">
            Locate branches and ATMs near you
          </p>
          
          {/* Search and Filter */}
          <div className="flex gap-4 flex-wrap">
            <Input
              type="text"
              placeholder="Search by city, state, or ZIP code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md bg-primary-foreground text-foreground"
            />
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "secondary" : "outline"}
                onClick={() => setFilterType("all")}
              >
                All Locations
              </Button>
              <Button
                variant={filterType === "branch" ? "secondary" : "outline"}
                onClick={() => setFilterType("branch")}
              >
                Branches
              </Button>
              <Button
                variant={filterType === "atm" ? "secondary" : "outline"}
                onClick={() => setFilterType("atm")}
              >
                ATMs
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Location List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">
              {filteredLocations.length} Location{filteredLocations.length !== 1 ? 's' : ''} Found
            </h2>
            
            {filteredLocations.map((location) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        {location.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                          {location.type === "branch" ? "Branch" : "ATM"}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{location.address}</p>
                      <p>{location.city}, {location.state} {location.zip}</p>
                    </div>
                  </div>
                  
                  {location.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${location.phone}`} className="hover:underline">
                        {location.phone}
                      </a>
                    </div>
                  )}
                  
                  {location.hours && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{location.hours}</span>
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    asChild
                  >
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get Directions
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;
