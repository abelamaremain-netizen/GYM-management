'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useTransition, useState } from 'react';

export default function MembersToolbar({ search, status }) {
  const router = useRouter();
  const [value, setValue] = useState(search);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (value) params.set('search', value);
    router.push(`/members?${params.toString()}`);
  }

  return (
    <form className="toolbar" onSubmit={handleSearch}>
      <div className="search-box">
        <Search size={17} />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search name, email, or phone"
        />
      </div>
      <button type="submit" className="button button-quiet">Search</button>
    </form>
  );
}
