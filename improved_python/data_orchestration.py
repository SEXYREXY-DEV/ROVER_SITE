import os
from parse_pokemon import PokemonParser
from parse_forms import FormsParser
from combine_pokemon import PokemonCombiner
from moves_to_json import MovesParser
from abilities_to_json import AbilitiesParser
from evos import Evolution
from unit_tests import unittest

class FilePaths:
    def __init__(self, base_dir="games"):
        self.base_dir = base_dir
        self.games = ['vanguard', 'ss2']  # Add more as needed

class DataOrchestrator:
    def __init__(self, paths: FilePaths):
        self.paths = paths

    def parse_pokemon(self):
        parser = PokemonParser()
        parser.process_pokemon_data(self.paths.games, base_dir=self.paths.base_dir)

    def parse_forms(self):
        parser = FormsParser()
        parser.process_forms_data(self.paths.games, base_dir=self.paths.base_dir)

    def combine_pokemon(self):
        combiner = PokemonCombiner(base_dir=self.paths.base_dir)
        combiner.process_multiple_games(self.paths.games)

    def parse_moves(self):
        parser = MovesParser()
        parser.process_moves_data(self.paths.games, base_dir=self.paths.base_dir)

    def parse_abilities(self):
        parser = AbilitiesParser()
        parser.process_abilities_data(self.paths.games, base_dir=self.paths.base_dir)

    def generate_evolutions(self):
        Evolution.process_multiple_games(self.paths.games, base_dir=self.paths.base_dir)

    def run_tests(self):
        print("\nRunning unit tests...")
        unittest.main(module='unit_tests', exit=False)

    def run_all(self):
        self.parse_pokemon()
        self.parse_forms()
        self.combine_pokemon()
        self.parse_moves()
        self.parse_abilities()
        self.generate_evolutions()
        self.run_tests()

if __name__ == "__main__":
    paths = FilePaths(base_dir="games")
    orchestrator = DataOrchestrator(paths)
    orchestrator.run_all()