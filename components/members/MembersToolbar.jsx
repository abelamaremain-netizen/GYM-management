'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function MembersToolbar({ search, status }) {
  const router = useRouter();
  const [value, setValue] = useState(search);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (value.trim()) params.set('search', value.trim());
    router.push(`/members?${params.toString()}`);
  }

  function handleClear() {
    setValue('');
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
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
      {value && <button type="button" className="button button-quiet" onClick={handleClear}>Clear</button>}
    </form>
  );
}
