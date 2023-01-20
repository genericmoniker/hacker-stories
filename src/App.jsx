import * as React from 'react';

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
  const [stories, dispatchStories] = React.useReducer(storiesReducer,
    { data: [], isLoading: false, isError: false }
  );

  // useEffect to hook into the lifecycle of the component.
  React.useEffect(() => {
    // If there is no search term, then don't do anything.
    if (!searchTerm) return;

    dispatchStories({ type: 'STORIES_FETCH_INIT' });
    fetch(`${API_ENDPOINT} ${searchTerm}`).then((response) => response.json())
    .then((result) => {
      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.hits,
      });
    }).catch(() =>
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
    );
  }, [searchTerm]); // Empty array would mean run once when component first renders.

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
      <InputWithLabel
        id="search"
        value={searchTerm}
        isFocused
        onInputChange={handleSearch}
      >
        <strong>Search:</strong>
      </InputWithLabel>
      <hr />
      {stories.isError && <p>Something went wrong...</p>}
      {stories.isLoading ? (
        <p>Loading...</p>
      ) : (
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
      )}
    </div>
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
