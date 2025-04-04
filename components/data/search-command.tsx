"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useSearch } from "@/hooks/use-search";
import { useHotkeys } from "@/hooks/use-hotkeys";

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { query, setQuery, suggestions, getSuggestions } = useSearch();

  useEffect(() => {
    if (query) {
      getSuggestions(query);
    }
  }, [query, getSuggestions]);

  useHotkeys("meta+k", () => setOpen(true));
  useHotkeys("ctrl+k", () => setOpen(true));
  useHotkeys("escape", () => setOpen(false));

  const handleSelect = (value: string) => {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search products..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {suggestions.length > 0 && (
          <CommandGroup heading="Suggestions">
            {suggestions.map((suggestion) => (
              <CommandItem
                key={suggestion}
                value={suggestion}
                onSelect={handleSelect}
              >
                {suggestion}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}