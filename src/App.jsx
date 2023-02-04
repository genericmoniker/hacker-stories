import * as React from 'react';
import axios from 'axios';

// A custom hook that replicates state to local storage.
const useStorageState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]); // Note `key` here too, since it could change.

  return [value, setValue];
};

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const App = () => {

  const storiesReducer = (state, action) => {
    switch (action.type) {
      case 'STORIES_FETCH_INIT':
        return { ...state, isLoading: true, isError: false };
      case 'STORIES_FETCH_SUCCESS':
        return { ...state, isLoading: false, isError: false, data: action.payload };
      case 'STORIES_FETCH_FAILURE':
        return { ...state, isLoading: false, isError: true };
      case 'REMOVE_STORY':
        return {
          ...state, data: state.filter(
            (story) => action.payload.objectID !== story.objectID
          ),
        }
      default:
        throw new Error();
    }
  };

  const [searchTerm, setSearchTerm] = useStorageState('search', 'React');
  const [url, setUrl] = React.useState(`${API_ENDPOINT}${searchTerm}`);
  const [stories, dispatchStories] = React.useReducer(storiesReducer,
    { data: [], isLoading: false, isError: false }
  );

  const handleSearchInput = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);

    // Avoid the browser reloading the page.
    event.preventDefault();
  };

  // useCallback creates a memoized version of the callback that only changes
  // if one of the dependencies (searchTerm here) has changed.
  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });
    try {
      const result = await axios.get(url);
      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' });
    }
  }, [url]);

  // useEffect to hook into the lifecycle of the component.
  React.useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]); // call the function when the memoized callback changes.

  const handleRemoveStory = (item) => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div>
      <h1>My Hacker Stories</h1>
      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      <hr />

      {stories.isError && <p>Something went wrong...</p>}
      {
        stories.isLoading ? (
          <p>Loading...</p>
        ) : (
          <List list={stories.data} onRemoveItem={handleRemoveStory} />
        )
      }
    </div >
  );
}


const SearchForm = ({
  searchTerm,
  onSearchInput,
  onSearchSubmit,
}) => {
  return (
    <form onSubmit={onSearchSubmit}>
      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={onSearchInput}
      >
        <strong>Search:</strong>
      </InputWithLabel>
      <button type="submit" disabled={!searchTerm}>
        Submit
      </button>
    </form>
  );
}

const InputWithLabel = ({
  id,
  value,
  type = 'text',
  onInputChange,
  isFocused,
  children,
}) => {
  return (
    <div>
      <label htmlFor={id}>{children}</label>
      &nbsp;
      <input
        id={id}
        type={type}
        value={value}
        autoFocus={isFocused}
        onChange={onInputChange} />
    </div>);
}

const List = ({ list, onRemoveItem }) => {
  return (
    <ul>
      {list.map((item) => (
        <Item key={item.objectID} item={item} onRemoveItem={onRemoveItem} />
      ))}
    </ul>
  );
}

const Item = ({ item, onRemoveItem }) => (
  <li>
    <span>
      <a href={item.url}>{item.title}</a>
    </span>
    <span>{item.author} </span>
    <span>{item.num_comments} </span>
    <span>{item.points}</span>
    &nbsp;
    <button type="button" onClick={() => onRemoveItem(item)}>Dismiss</button>
  </li>
);

export default App;
