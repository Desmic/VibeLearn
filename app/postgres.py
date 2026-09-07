"""PostgreSQL connection boundary; all learning commands use a single transaction."""
import psycopg


class Row(dict):
    """Keep existing named and positional access at the storage boundary."""
    def __getitem__(self, key):
        if isinstance(key, int):
            return tuple(self.values())[key]
        return super().__getitem__(key)


def row_factory(cursor):
    names = [column.name for column in cursor.description] if cursor.description else []
    return lambda values: Row(zip(names, values))


class PostgresConnection:
    postgres = True

    def __init__(self, dsn):
        # Supavisor transaction pooling cannot rely on session prepared statements.
        self.connection = psycopg.connect(
            dsn, connect_timeout=10, prepare_threshold=None, row_factory=row_factory
        )

    def begin(self, learner=None, lock=False):
        self.connection.execute("SET LOCAL ROLE vibelearn_app")
        self.connection.execute("SET LOCAL search_path = vibelearn, pg_catalog")
        self.connection.execute("SET LOCAL statement_timeout = '10s'")
        self.connection.execute("SET LOCAL lock_timeout = '5s'")
        self.connection.execute("SELECT set_config('app.learner_id', %s, true)", (learner or "",))
        if lock:
            if not learner:
                raise ValueError("A learner is required for a command lock")
            # Serialize each learner's commands, not all learners' writes.
            self.connection.execute("SELECT pg_advisory_xact_lock(hashtextextended(%s, 0))", (learner,))

    def execute(self, query, parameters=()):
        # Application queries use qmark parameters; values never enter SQL text.
        return self.connection.execute(query.replace("?", "%s"), parameters)

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()
