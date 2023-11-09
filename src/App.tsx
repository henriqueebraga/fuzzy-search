import '@/styles/reset.scss'
import { useState, useMemo, useEffect, useRef } from 'react';
import countries from './data/countries';
import { CountryType } from './types/index'
import Fuse from 'fuse.js';
import { setCookie, getCookie, clearCookie } from './utils/common';
import MagnifierIcon from './components/MagnifierIcon'
import styles from '@/styles/app.module.scss';

function App() {
	const [query, setQuery] = useState('');
	const [keyword, setKeyword] = useState(getCookie('selectedQuery') || '');
	const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
	const [toggleSuggestion, setToggleSuggestion] = useState(false);
	const suggestionListRef = useRef(null);

	useEffect(() => {
		setSelectedItemIndex(-1);
	}, [query]);

	const fuse = useMemo(() => {
		return new Fuse(countries, {

			threshold: 0.2,
			location: 0,
			distance: 100,
			includeScore: true,
			keys: ['name', 'code'],
		});
	}, []);

	const results: CountryType[] = useMemo(() => {
		if (query) {
			const searchResults = fuse.search(query);
			return searchResults
				.sort((a, b) => a.item.score - b.item.score)
				.map((result) => result.item);
		} else {
			return [];
		}
	}, [query, fuse]);
	console.log('results', results);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		setToggleSuggestion(true);
		if (e.key === 'ArrowDown') {
			if (selectedItemIndex < results.length - 1) {
				// Move selection down
				if (selectedItemIndex === -1) {
					setKeyword(results[0].name)
					setSelectedItemIndex(0)
				} else {
					setSelectedItemIndex((prevIndex) =>
						prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex
					);
					setKeyword(results[selectedItemIndex + 1].name)
					console.log(selectedItemIndex)
				}

				if (suggestionListRef.current) {
					const suggestionList = suggestionListRef.current as HTMLElement;
					console.log('suggestionList', suggestionList.children);
					const suggestionItem = suggestionList.children[selectedItemIndex + 1];

					if (suggestionItem) {
						suggestionItem.scrollIntoView({
							block: 'center',
						});
					}
				}
			}
		} else if (e.key === 'ArrowUp') {
			if (selectedItemIndex > 0) {
				setSelectedItemIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
				setKeyword(results[selectedItemIndex - 1].name)

				if (suggestionListRef.current) {
					const suggestionList = suggestionListRef.current as HTMLElement;
					console.log('suggestionList', suggestionList);
					const suggestionItem = suggestionList.children[selectedItemIndex - 1];

					if (suggestionItem) {
						suggestionItem.scrollIntoView({
							block: 'center',
						});
					}
				}
			}
		} else if (e.key === 'Enter') {
			if (selectedItemIndex >= 0) {
				// e.preventDefault();
				setQuery(results[selectedItemIndex].name);
				setCookie('selectedQuery', results[selectedItemIndex].name, 7);
			}
			setToggleSuggestion(false);
		}
		console.log(selectedItemIndex)
	};
	console.log('selectedItemIndex', selectedItemIndex);

	function handleSelectSuggestion(index: number) {
		console.log('index', index);
		if (index >= 0) {
			setQuery(results[index].name);
			console.log('results[index].name', results[index].name);
			setCookie('selectedQuery', results[index].name, 7);
		}
		setToggleSuggestion(false);
	}

	function highlightText(text: string, query: string) {
		if (text && query) {
			const lowerCaseText = text?.toLowerCase();
			const lowerCaseQuery = query?.toLowerCase();
			const startIndex = lowerCaseText?.indexOf(lowerCaseQuery);
			if (startIndex !== -1) {
				const endIndex = startIndex + lowerCaseQuery.length;
				return (
					<span className={styles['suggestion-list__item__text']}>
						{text?.substring(0, startIndex)}
						<span className={styles['highlighted']}>{text?.substring(startIndex, endIndex)}</span>
						{text?.substring(endIndex)}
					</span>
				);
			}
		}
		return text;
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setToggleSuggestion(true);
		const inputValue = e.target.value;
		setQuery(inputValue);
		setKeyword(inputValue)
		if (inputValue === '') {
			clearCookie('selectedQuery');
		} else {
			setCookie('selectedQuery', inputValue, 7);
		}
	};

	return (
		<>
			<h1>COUNTRIES</h1>
			<div
				className={styles['search-container']}>
				<MagnifierIcon style='search-container__icon' />
				<input
					className={styles['search-container__input']}
					value={keyword}
					type="search"
					onChange={handleInputChange}
					placeholder="Search..."
					onKeyDown={handleKeyDown}
				/>
				{query && toggleSuggestion && (
					<ul className={styles['suggestion-list']} ref={suggestionListRef}>
						{results?.map((country, index) => {
							const handleItemClassStyle = index === selectedItemIndex
								? `${styles['suggestion-list__item']} ${styles['selected']}`
								: styles['suggestion-list__item'];
							return (
								<li
									key={country.code}
									className={handleItemClassStyle}
									onClick={() => handleSelectSuggestion(index)}
								>
									<MagnifierIcon style='suggestion-list__item__icon' />
									{highlightText(country.name, query)},&nbsp;{highlightText(country.code, query)}
								</li>
							)
						})}
					</ul>
				)}
			</div>
		</>
	);
}

export default App;
