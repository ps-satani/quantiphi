import { useState } from 'react';

export default function SearchBar({ initialValue, onSearch, loading }) {
  const [value, setValue] = useState(initialValue);

  const submit = (e) => {
    e.preventDefault();
    const username = value.trim();
    if (username) onSearch(username);
  };

  return (
    <form className="search" onSubmit={submit}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="GitHub username, e.g. torvalds"
        aria-label="GitHub username"
      />
      <button type="submit" disabled={loading}>{loading ? 'Loading…' : 'View portfolio'}</button>
    </form>
  );
}
