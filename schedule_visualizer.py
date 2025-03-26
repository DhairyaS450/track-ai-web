from colorama import init, Fore, Back, Style
from typing import List, Tuple
import time

# Initialize colorama for Windows compatibility
init()

class ScheduleBlock:
    def __init__(self, duration: int, is_study: bool):
        self.duration = duration  # in minutes
        self.is_study = is_study
        self.is_skipped = False

class ScheduleVisualizer:
    def __init__(self, study_duration: int = 15, break_duration: int = 5):
        self.study_duration = study_duration
        self.break_duration = break_duration
        self.blocks: List[ScheduleBlock] = []
        self.current_index = 0
        self.total_time = 0

    def create_schedule(self, total_study_sessions: int):
        """Create a schedule with alternating study and break blocks."""
        self.blocks = []
        self.total_time = 0
        
        for i in range(total_study_sessions):
            # Add study block
            study_block = ScheduleBlock(self.study_duration, True)
            self.blocks.append(study_block)
            self.total_time += self.study_duration
            
            # Add break block (except after the last study session)
            if i < total_study_sessions - 1:
                break_block = ScheduleBlock(self.break_duration, False)
                self.blocks.append(break_block)
                self.total_time += self.break_duration

    def skip_current_block(self):
        """Skip the current block and mark it as skipped."""
        if self.current_index < len(self.blocks):
            self.blocks[self.current_index].is_skipped = True
            self.current_index += 1
            return True
        return False

    def display_schedule(self):
        """Display the current schedule with color-coded blocks."""
        print("\nCurrent Schedule:")
        print("=" * 50)
        
        for i, block in enumerate(self.blocks):
            if block.is_skipped:
                continue
                
            if block.is_study:
                color = Fore.BLUE
                label = f"Study ({block.duration}m)"
            else:
                color = Fore.GREEN
                label = f"Break ({block.duration}m)"
            
            if i == self.current_index:
                print(f"{color}[{label}]{Style.RESET_ALL}", end="")
            else:
                print(f"{color}{label}{Style.RESET_ALL}", end="")
            
            if i < len(self.blocks) - 1 and not self.blocks[i + 1].is_skipped:
                print(" → ", end="")
        
        print("\n" + "=" * 50)
        print(f"Current Block: {self.current_index + 1}/{len(self.blocks)}")
        print(f"Total Time Remaining: {self.total_time} minutes")

def main():
    # Create a schedule with 4 study sessions
    visualizer = ScheduleVisualizer(study_duration=15, break_duration=5)
    visualizer.create_schedule(4)
    
    while True:
        visualizer.display_schedule()
        
        action = input("\nActions:\n1. Skip current block\n2. Exit\nEnter your choice (1-2): ")
        
        if action == "1":
            if not visualizer.skip_current_block():
                print("No more blocks to skip!")
                break
        elif action == "2":
            break
        else:
            print("Invalid choice. Please try again.")
        
        print("\n" + "=" * 50)

if __name__ == "__main__":
    main() 