// Cache resources
// http://localhost:3000/isolated/exercise/04.js

import * as React from 'react'
import {
  fetchPokemon,
  PokemonInfoFallback,
  PokemonForm,
  PokemonDataView,
  PokemonErrorBoundary,
} from '../pokemon'
import {createResource} from '../utils'

function PokemonInfo({pokemonResource}) {
  const pokemon = pokemonResource.read()
  return (
    <div>
      <div className="pokemon-info__img-wrapper">
        <img src={pokemon.image} alt={pokemon.name} />
      </div>
      <PokemonDataView pokemon={pokemon} />
    </div>
  )
}

const SUSPENSE_CONFIG = {
  timeoutMs: 4000,
  busyDelayMs: 300,
  busyMinDurationMs: 700,
}

const PokemonContext = React.createContext()

function createPokemonResource(pokemonName) {
  return createResource(fetchPokemon(pokemonName))
}

function usePokemonResourceCache() {
  return React.useContext(PokemonContext)
}

function PokemonCacheProvider({children, cacheTime = 10000}) {
  // 🐨 create a pokemonResourceCache object
  const cache = React.useRef({})

  // 🐨 create a getPokemonResource function which accepts a name checks the cache
  // for an existing resource. If there is none, then it creates a resource
  // and inserts it into the cache. Finally the function should return the
  // resource.
  const getPokemonResource = React.useCallback(
    pokemonName => {
      // Make case agnostic just in case lol
      const lowerName = pokemonName.toLowerCase()
      let cacheHit = cache.current[lowerName]
      if (!cacheHit || cacheHit.time < new Date().getTime() - cacheTime) {
        cacheHit = {
          resource: createPokemonResource(lowerName),
          time: new Date().getTime(),
        }
        cache.current[lowerName] = cacheHit
      }
      return cacheHit.resource
    },
    [cacheTime],
  )
  return (
    <PokemonContext.Provider value={getPokemonResource}>
      {children}
    </PokemonContext.Provider>
  )
}

function App() {
  const [pokemonName, setPokemonName] = React.useState('')
  const [startTransition, isPending] = React.useTransition(SUSPENSE_CONFIG)
  const [pokemonResource, setPokemonResource] = React.useState(null)
  const getPokemonResource = usePokemonResourceCache()

  React.useEffect(() => {
    if (!pokemonName) {
      setPokemonResource(null)
      return
    }
    startTransition(() => {
      // 🐨 change this to getPokemonResource instead
      setPokemonResource(getPokemonResource(pokemonName))
    })
  }, [pokemonName, startTransition, getPokemonResource])

  function handleSubmit(newPokemonName) {
    setPokemonName(newPokemonName)
  }

  function handleReset() {
    setPokemonName('')
  }

  return (
    <div className="pokemon-info-app">
      <PokemonForm pokemonName={pokemonName} onSubmit={handleSubmit} />
      <hr />
      <div className={`pokemon-info ${isPending ? 'pokemon-loading' : ''}`}>
        {pokemonResource ? (
          <PokemonErrorBoundary
            onReset={handleReset}
            resetKeys={[pokemonResource]}
          >
            <React.Suspense
              fallback={<PokemonInfoFallback name={pokemonName} />}
            >
              <PokemonInfo pokemonResource={pokemonResource} />
            </React.Suspense>
          </PokemonErrorBoundary>
        ) : (
          'Submit a pokemon'
        )}
      </div>
    </div>
  )
}

function AppWithProvider() {
  return (
    <PokemonCacheProvider>
      <App />
    </PokemonCacheProvider>
  )
}

export default AppWithProvider
