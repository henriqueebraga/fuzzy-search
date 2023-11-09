import '@/styles/reset.scss'
import { useState, useMemo, useEffect, useRef } from 'react';
import countries from './data/countries';
import { CountryType, SearchResult } from './types/index'
import Fuse from 'fuse.js';
import { setCookie, getCookie, clearCookie } from './utils/common';
import MagnifierIcon from './components/MagnifierIcon'
import styles from '@/styles/app.module.scss';

function App() {
	const [query, setQuery] = useState('');
	/* const [countries, setCountries] = useState<CountryType[]>([]); */
	const [keyword, setKeyword] = useState(getCookie('selectedQuery') || '');
	const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
	const [toggleSuggestion, setToggleSuggestion] = useState(false);
	const suggestionListRef = useRef(null);

	useEffect(() => {
		/* fetchCountries(); */
		setSelectedItemIndex(-1);
	}, [query]);

	/* 
		const fetchCountries = async () => {
			try {
			const response = await fetch('api_endpoint');
			if (response.ok) {
				const data = await response.json();
				setCountries(data);
			} else {
				console.error('Failed to fetch countries');
			}
			} catch (error) {
			console.error('Error fetching countries', error);
			}
		};
	
	*/
	const fuse = useMemo(() => {
		return new Fuse(countries, {
			threshold: 0.2,
			location: 0,
			distance: 100,
			includeScore: true,
			keys: ['name', 'code'],
		});
	}, [countries]);

	const results: CountryType[] = useMemo(() => {
		if (query) {
			const searchResults: SearchResult[] = fuse.search(query);
			return searchResults
				.map((result) => result.item);
		} else {
			return [];
		}
	}, [query, fuse]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		setToggleSuggestion(true);
		if (e.key === 'ArrowDown') {
			if (selectedItemIndex < results.length - 1) {
				if (selectedItemIndex === -1) {
					setKeyword(`${results[0].name}, ${results[0].code}`);
					setSelectedItemIndex(0)
				} else {
					setSelectedItemIndex((prevIndex) =>
						prevIndex < results.length - 1 ? prevIndex + 1 : prevIndex
					);
					setKeyword(`${results[selectedItemIndex + 1].name}, ${results[selectedItemIndex + 1].code}`);
				}

				if (suggestionListRef.current) {
					const suggestionList = suggestionListRef.current as HTMLElement;
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
				setKeyword(`${results[selectedItemIndex - 1].name}, ${results[selectedItemIndex - 1].code}`);

				if (suggestionListRef.current) {
					const suggestionList = suggestionListRef.current as HTMLElement;
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
				setQuery(results[selectedItemIndex].name);
				setKeyword(`${results[selectedItemIndex].name}, ${results[selectedItemIndex].code}`);
				setCookie('selectedQuery', `${results[selectedItemIndex].name}, ${results[selectedItemIndex].code}`, 7);
				console.log(`Selected: ${results[selectedItemIndex].name}, ${results[selectedItemIndex].code}`);
			}
			setToggleSuggestion(false);
		}
	};

	function handleSelectSuggestion(index: number) {
		if (index >= 0) {
			setKeyword(`${results[index].name}, ${results[index].code}`);
			setQuery(results[index].name);
			setCookie('selectedQuery', `${results[index].name}, ${results[index].code}`, 7);
			console.log(`Selected: ${results[index].name}, ${results[index].code}`);
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
			<h1 className={styles['search-title']}>Where would you like to go?</h1>
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
